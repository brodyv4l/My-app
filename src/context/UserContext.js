import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { DEFAULT_GOALS } from '../data/foods';
import { DEFAULT_HABITS } from '../constants/theme';
import { normalizeProfileUnits } from '../utils/units';
import { applyStreakOnFoodLog } from '../utils/streak';
import { applySobrietyToggle } from '../utils/sobriety';
import { getLocalDateString } from '../utils/dates';
import { checkIsPro as checkIsProFn, daysRemainingInTrial as calcTrialDays, trialExpired } from '../utils/subscription';
import { preferLocalSubscriptionMerge, preferLocalSurveyMerge, isSurveyComplete } from '../utils/subscriptionMerge';
import {
  canUseSupabaseData,
  fetchProfile,
  upsertProfile,
  fetchFoodLogs,
  fetchWeightLogs,
  insertWeightLog,
  insertFoodLog,
  updateFoodLog,
  deleteFoodLog,
  fetchSavedFoods,
  upsertSavedFood,
  deleteSavedFood,
  migrateLocalFoodLogs,
  isSupabaseLogId,
  fetchFastingLogs,
  insertFastingLog,
} from '../services/supabaseData';

const UserContext = createContext(null);

const defaultProfile = {
  name: '',
  age: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  gender: 'male',
  activityLevel: 'moderate',
  goalType: '',
  goalStrategy: '',
  targetWeight: '',
  targetDate: '',
  surveyCompletedAt: '',
  dietaryPreferences: [],
  onboardingComplete: false,
  calorieGoal: DEFAULT_GOALS.calories,
  macroGoals: { protein: DEFAULT_GOALS.protein, carbs: DEFAULT_GOALS.carbs, fat: DEFAULT_GOALS.fat },
  aiExplanation: '',
  streakCount: 0,
  streakStartDate: '',
  lastLoggedDate: '',
  streakBroken: false,
  subscriptionStatus: 'free',
  subscriptionPlan: null,
  trialStartDate: '',
  trialEndDate: '',
  isFounder: false,
  accessCodeUsed: null,
  waterGoalOz: 0,
  unitPrefs: { weight: 'lbs', height: 'ft', measurements: 'in', water: 'oz', energy: 'kcal' },
  themeMode: 'dark',
  notificationPrefs: { mealReminders: true, waterReminders: true, weeklyReport: false, streakAlerts: true },
  customHabits: [],
  showSobrietyTracker: false,
  sobrietyStreakCount: 0,
  sobrietyLastCleanDate: '',
  authProvider: 'email',
  googleId: null,
  avatarUrl: null,
};

function storageKey(uid, key) {
  return `foodprint-${uid}-${key}`;
}

function newWeightLogId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `weight-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function sortWeightLogs(a, b) {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  return (a.createdAt || '').localeCompare(b.createdAt || '');
}

function mergeFoodEntries(local, remote) {
  if (!remote || !Object.keys(remote).length) return local || {};
  if (!local || !Object.keys(local).length) return remote;
  const merged = { ...remote };
  Object.entries(local).forEach(([date, entries]) => {
    const remoteDay = merged[date] || [];
    const byId = new Map(remoteDay.map((entry) => [String(entry.id), entry]));
    (entries || []).forEach((entry) => {
      byId.set(String(entry.id), entry);
    });
    merged[date] = Array.from(byId.values());
  });
  return merged;
}

function mergeWeightLogs(local, remote) {
  const localLogs = Array.isArray(local) ? local : [];
  const remoteLogs = Array.isArray(remote) ? remote : [];
  if (!remoteLogs.length) return localLogs;
  if (!localLogs.length) return remoteLogs;
  const byId = new Map(remoteLogs.map((entry) => [String(entry.id), entry]));
  localLogs.forEach((entry) => {
    if (!byId.has(String(entry.id))) byId.set(String(entry.id), entry);
  });
  return Array.from(byId.values()).sort(sortWeightLogs);
}

function readStoredProfile(uid, fallback = defaultProfile) {
  return AsyncStorage.getItem(storageKey(uid, 'profile')).then((raw) => {
    if (!raw) return fallback;
    try {
      return normalizeProfileUnits({ ...defaultProfile, ...JSON.parse(raw) });
    } catch {
      return fallback;
    }
  });
}

function collectRemoteFoodIds(grouped) {
  const ids = new Set();
  Object.values(grouped || {}).forEach((entries) => {
    (entries || []).forEach((entry) => ids.add(String(entry.id)));
  });
  return ids;
}

function preserveLocalOnboarding(local, merged) {
  if (!local || !isSurveyComplete(local)) return merged;
  const surveyPatch = preferLocalSurveyMerge(local, merged);
  return normalizeProfileUnits({
    ...merged,
    ...surveyPatch,
    onboardingComplete: true,
    surveyCompletedAt: merged.surveyCompletedAt || local.surveyCompletedAt || surveyPatch.surveyCompletedAt,
  });
}

function trialDatesFromNow() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return {
    trialStartDate: getLocalDateString(start),
    trialEndDate: getLocalDateString(end),
    subscriptionStatus: 'trial',
    subscriptionPlan: 'monthly',
  };
}

export function UserProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [foodEntries, setFoodEntries] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [waterLogs, setWaterLogs] = useState({});
  const [habitLogs, setHabitLogs] = useState({});
  const [progressPhotos, setProgressPhotos] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [groceryChecked, setGroceryChecked] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [aiMessagesToday, setAiMessagesToday] = useState(0);
  const [searchIntent, setSearchIntent] = useState({ meal: null, tab: null });
  const [activeFastStart, setActiveFastStart] = useState(null);
  const [fastingLogs, setFastingLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const uid = user?.uid;

  const resetUserData = useCallback(() => {
    setProfile(defaultProfile);
    setFoodEntries({});
    setWeightLogs([]);
    setWaterLogs({});
    setHabitLogs({});
    setProgressPhotos({});
    setFavorites([]);
    setCustomFoods([]);
    setMealPlan(null);
    setGroceryChecked({});
    setChatMessages([]);
    setAiMessagesToday(0);
    setActiveFastStart(null);
    setFastingLogs([]);
    setLoaded(false);
  }, []);

  useEffect(() => {
    if (!uid) {
      resetUserData();
      setLoaded(true);
      return undefined;
    }

    setLoaded(false);
    let cancelled = false;
    const keys = ['profile','foodEntries','weightLogs','waterLogs','habitLogs','progressPhotos','favorites','customFoods','mealPlan','groceryChecked','chatMessages','aiChatMeta','activeFasting','fastingLogs'];
    const useCloud = canUseSupabaseData(user);

    const loadTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('User data load timed out — showing app with cached data');
        setLoaded(true);
      }
    }, 12000);

    async function load() {
      const vals = await Promise.all(keys.map((k) => AsyncStorage.getItem(storageKey(uid, k))));
      const [p, f, w, wl, hl, pp, fav, custom, mp, gc, chat, aiMeta, activeFast, fastLogs] = vals;

      let profileData = p ? normalizeProfileUnits({ ...defaultProfile, ...JSON.parse(p), name: JSON.parse(p).name || user?.name || '', avatarUrl: JSON.parse(p).avatarUrl || user?.avatarUrl || null }) : {
        ...defaultProfile,
        name: user?.name || '',
        avatarUrl: user?.avatarUrl || null,
        authProvider: user?.authProvider || 'email',
        googleId: user?.googleId || null,
      };

      let foodData = f ? JSON.parse(f) : {};
      let favData = fav ? JSON.parse(fav) : [];

      if (useCloud) {
        const remoteProfile = await fetchProfile(uid);
        const freshLocal = await readStoredProfile(uid, profileData);

        if (remoteProfile) {
          const surveyMerge = preferLocalSurveyMerge(freshLocal, remoteProfile);
          profileData = normalizeProfileUnits({
            ...defaultProfile,
            ...remoteProfile,
            ...surveyMerge,
            ...preferLocalSubscriptionMerge(freshLocal, remoteProfile),
            name: remoteProfile.name || freshLocal.name || user?.name || profileData.name,
            avatarUrl: remoteProfile.avatarUrl || freshLocal.avatarUrl || user?.avatarUrl || profileData.avatarUrl,
            onboardingComplete: isSurveyComplete({
              ...remoteProfile,
              ...freshLocal,
              ...surveyMerge,
            }),
          });
          profileData = preserveLocalOnboarding(freshLocal, profileData);
          if (Object.keys(surveyMerge).length && canUseSupabaseData(user)) {
            upsertProfile(uid, profileData, user?.email).catch((e) => {
              console.warn('syncSurveyProfile:', e?.message);
            });
          }
        } else {
          profileData = preserveLocalOnboarding(freshLocal, profileData);
        }

        const freshFoodRaw = await AsyncStorage.getItem(storageKey(uid, 'foodEntries'));
        const freshFood = freshFoodRaw ? JSON.parse(freshFoodRaw) : foodData;
        const remoteLogs = await fetchFoodLogs(uid);
        if (remoteLogs) {
          foodData = mergeFoodEntries(freshFood, remoteLogs);
          const remoteFoodIds = collectRemoteFoodIds(remoteLogs);
          const unsyncedFood = [];
          Object.entries(foodData).forEach(([date, entries]) => {
            (entries || []).forEach((entry) => {
              if (!remoteFoodIds.has(String(entry.id)) && !isSupabaseLogId(entry.id)) {
                unsyncedFood.push({ date, entry });
              }
            });
          });
          if (unsyncedFood.length) {
            await Promise.all(
              unsyncedFood.map(({ date, entry }) => insertFoodLog(uid, date, entry).catch((e) => {
                console.warn('syncFoodLog:', e?.message);
              })),
            );
          } else if (!Object.keys(remoteLogs).length && Object.keys(foodData).length) {
            await migrateLocalFoodLogs(uid, foodData);
          }
        } else {
          foodData = freshFood;
          if (Object.keys(foodData).length) {
            await migrateLocalFoodLogs(uid, foodData);
          }
        }

        const remoteFavs = await fetchSavedFoods(uid);
        if (remoteFavs?.length) {
          favData = remoteFavs;
          await AsyncStorage.setItem(storageKey(uid, 'favorites'), JSON.stringify(favData));
        }
      } else {
        profileData = preserveLocalOnboarding(profileData, profileData);
      }

      let weightData = w ? JSON.parse(w) : [];
      const freshWeightRaw = await AsyncStorage.getItem(storageKey(uid, 'weightLogs'));
      const freshWeight = freshWeightRaw ? JSON.parse(freshWeightRaw) : weightData;
      if (useCloud) {
        const remoteWeights = await fetchWeightLogs(uid);
        const remoteIds = new Set((remoteWeights || []).map((log) => String(log.id)));
        weightData = mergeWeightLogs(freshWeight, remoteWeights || []);
        const unsynced = weightData.filter((log) => !remoteIds.has(String(log.id)));
        if (unsynced.length) {
          await Promise.all(
            unsynced.map((log) => insertWeightLog(uid, log).catch((e) => {
              console.warn('syncWeightLog:', e?.message);
            })),
          );
        }
      } else {
        weightData = freshWeight;
      }

      if (cancelled) return;

      await AsyncStorage.setItem(storageKey(uid, 'profile'), JSON.stringify(profileData));
      await AsyncStorage.setItem(storageKey(uid, 'foodEntries'), JSON.stringify(foodData));
      await AsyncStorage.setItem(storageKey(uid, 'weightLogs'), JSON.stringify(weightData));

      setProfile(profileData);
      setFoodEntries(foodData);
      setWeightLogs(Array.isArray(weightData) ? weightData.sort(sortWeightLogs) : []);
      if (wl) setWaterLogs(JSON.parse(wl));
      if (hl) setHabitLogs(JSON.parse(hl));
      if (pp) setProgressPhotos(JSON.parse(pp));
      setFavorites(favData);
      if (custom) setCustomFoods(JSON.parse(custom));
      if (mp) setMealPlan(JSON.parse(mp));
      if (gc) setGroceryChecked(JSON.parse(gc));
      if (chat) setChatMessages(JSON.parse(chat));
      if (aiMeta) {
        const meta = JSON.parse(aiMeta);
        if (meta.date === getLocalDateString()) setAiMessagesToday(meta.count || 0);
      }
      if (activeFast) {
        try {
          const parsed = JSON.parse(activeFast);
          setActiveFastStart(typeof parsed === 'string' ? parsed : null);
        } catch {
          setActiveFastStart(null);
        }
      }
      if (fastLogs) {
        try { setFastingLogs(JSON.parse(fastLogs)); } catch { setFastingLogs([]); }
      }
      if (useCloud) {
        const remoteFasts = await fetchFastingLogs(uid);
        if (remoteFasts?.length) {
          setFastingLogs(remoteFasts);
          await AsyncStorage.setItem(storageKey(uid, 'fastingLogs'), JSON.stringify(remoteFasts));
        }
      }
      setLoaded(true);
    }

    load()
      .catch((e) => {
        console.warn('User data load failed:', e?.message);
        setLoaded(true);
      })
      .finally(() => {
        clearTimeout(loadTimeout);
      });

    return () => {
      cancelled = true;
      clearTimeout(loadTimeout);
    };
  }, [uid, resetUserData]);

  const persist = useCallback(async (key, value) => {
    if (!uid) return;
    await AsyncStorage.setItem(storageKey(uid, key), JSON.stringify(value));
  }, [uid]);

  const updateProfile = useCallback(async (updates) => {
    let nextProfile = null;
    setProfile((prev) => {
      nextProfile = { ...prev, ...updates };
      return nextProfile;
    });
    if (!uid || !nextProfile) return nextProfile;
    await persist('profile', nextProfile);
    if (canUseSupabaseData(user)) {
      await upsertProfile(uid, nextProfile, user?.email);
    }
    return nextProfile;
  }, [persist, uid, user]);

  const addFoodEntry = useCallback(async (date, entry) => {
    const optimisticId = entry.id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimistic = { ...entry, id: optimisticId };

    const commitEntry = async (savedEntry) => {
      let nextEntries;
      let wasEmpty = false;
      setFoodEntries((prev) => {
        const dayEntries = prev[date] || [];
        wasEmpty = dayEntries.length === 0;
        const withoutDup = dayEntries.filter((e) => e.id !== optimisticId && e.id !== savedEntry.id);
        nextEntries = { ...prev, [date]: [...withoutDup, savedEntry] };
        return nextEntries;
      });
      await persist('foodEntries', nextEntries);
      if (wasEmpty) {
        setProfile((p) => {
          const updated = applyStreakOnFoodLog(p, date);
          persist('profile', updated);
          if (canUseSupabaseData(user)) upsertProfile(uid, updated, user?.email);
          return updated;
        });
      }
    };

    await commitEntry(optimistic);

    if (canUseSupabaseData(user)) {
      insertFoodLog(uid, date, entry).then(async (saved) => {
        if (saved?.id && saved.id !== optimisticId) {
          let nextEntries;
          setFoodEntries((prev) => {
            const day = (prev[date] || []).map((e) => (e.id === optimisticId ? saved : e));
            nextEntries = { ...prev, [date]: day };
            return nextEntries;
          });
          await persist('foodEntries', nextEntries);
        }
      }).catch((e) => console.warn('insertFoodLog:', e?.message));
    }
  }, [persist, uid, user]);

  const removeFoodEntry = useCallback((date, id) => {
    if (canUseSupabaseData(user) && isSupabaseLogId(id)) {
      deleteFoodLog(id);
    }
    setFoodEntries((prev) => {
      const next = { ...prev, [date]: (prev[date] || []).filter((e) => e.id !== id) };
      persist('foodEntries', next);
      return next;
    });
  }, [persist, user]);

  const updateFoodEntry = useCallback((date, id, updates) => {
    if (canUseSupabaseData(user) && isSupabaseLogId(id)) {
      updateFoodLog(id, updates);
    }
    setFoodEntries((prev) => {
      const next = {
        ...prev,
        [date]: (prev[date] || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
      };
      persist('foodEntries', next);
      return next;
    });
  }, [persist, user]);

  const setWaterForDate = useCallback((date, oz) => {
    setWaterLogs((prev) => {
      const next = { ...prev, [date]: oz };
      persist('waterLogs', next);
      return next;
    });
  }, [persist]);

  const toggleHabitForDate = useCallback((date, habitId) => {
    setHabitLogs((prev) => {
      const day = { ...(prev[date] || {}) };
      day[habitId] = !day[habitId];
      const next = { ...prev, [date]: day };
      persist('habitLogs', next);

      if (habitId === 'no_alcohol') {
        setProfile((p) => {
          const updated = applySobrietyToggle(p, date, !!day[habitId]);
          persist('profile', updated);
          if (canUseSupabaseData(user)) upsertProfile(uid, updated, user?.email);
          return updated;
        });
      }
      return next;
    });
  }, [persist, uid, user]);

  const saveProgressPhoto = useCallback((date, photo) => {
    setProgressPhotos((prev) => {
      const next = { ...prev, [date]: photo };
      persist('progressPhotos', next);
      return next;
    });
  }, [persist]);

  const addWeightLog = useCallback(async (log) => {
    const entry = {
      id: log.id || newWeightLogId(),
      date: log.date || getLocalDateString(),
      weight: log.weight,
      createdAt: log.createdAt || new Date().toISOString(),
      photoUri: log.photoUri || null,
    };

    let saved = entry;
    if (canUseSupabaseData(user)) {
      const remote = await insertWeightLog(uid, entry);
      if (remote) saved = remote;
    }

    let nextLogs;
    setWeightLogs((prev) => {
      nextLogs = [...prev, saved].sort(sortWeightLogs);
      return nextLogs;
    });
    await persist('weightLogs', nextLogs);
  }, [persist, uid, user]);

  const toggleFavorite = useCallback((food) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === food.id);
      const next = exists ? prev.filter((f) => f.id !== food.id) : [...prev, food];
      persist('favorites', next);
      if (canUseSupabaseData(user)) {
        if (exists) deleteSavedFood(uid, food.id);
        else upsertSavedFood(uid, food);
      }
      return next;
    });
  }, [persist, uid, user]);

  const addCustomFood = useCallback((food) => {
    const item = { ...food, id: `custom-${Date.now()}`, source: 'custom' };
    setCustomFoods((prev) => {
      const next = [...prev, item];
      persist('customFoods', next);
      return next;
    });
    return item;
  }, [persist]);

  const toggleGroceryItem = useCallback((key) => {
    setGroceryChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persist('groceryChecked', next);
      return next;
    });
  }, [persist]);

  const saveMealPlan = useCallback((plan) => {
    const withMeta = { ...plan, generatedAt: new Date().toISOString() };
    setGroceryChecked({});
    persist('groceryChecked', {});
    setMealPlan(withMeta);
    persist('mealPlan', withMeta);
    return withMeta;
  }, [persist]);

  const appendChatMessage = useCallback((msg) => {
    setChatMessages((prev) => {
      const next = [...prev, msg].slice(-50);
      persist('chatMessages', next);
      return next;
    });
  }, [persist]);

  const incrementUserMessageCount = useCallback(() => {
    const today = getLocalDateString();
    setAiMessagesToday((c) => {
      const count = c + 1;
      persist('aiChatMeta', { date: today, count });
      return count;
    });
  }, [persist]);

  const startFast = useCallback(() => {
    const start = new Date().toISOString();
    setActiveFastStart(start);
    persist('activeFasting', start);
  }, [persist]);

  const endFast = useCallback(async () => {
    if (!activeFastStart) return null;
    const endTime = new Date();
    const startTime = new Date(activeFastStart);
    const ms = endTime - startTime;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const durationHours = hours + minutes / 60;
    const log = {
      id: newWeightLogId(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationHours,
      date: getLocalDateString(endTime),
    };

    let saved = log;
    if (canUseSupabaseData(user)) {
      const remote = await insertFastingLog(uid, log);
      if (remote) saved = remote;
    }

    setFastingLogs((prev) => {
      const next = [saved, ...prev].slice(0, 50);
      persist('fastingLogs', next);
      return next;
    });
    setActiveFastStart(null);
    persist('activeFasting', null);
    return { hours, minutes, durationHours };
  }, [activeFastStart, persist, uid, user]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    persist('chatMessages', []);
  }, [persist]);

  const getDayTotals = useCallback((date) => {
    const entries = foodEntries[date] || [];
    return entries.reduce((acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodEntries]);

  const habits = useMemo(() => {
    const custom = (profile.customHabits || []).map((h) => ({ ...h, auto: false }));
    return [...DEFAULT_HABITS, ...custom];
  }, [profile.customHabits]);

  const goals = useMemo(() => ({
    calories: profile.calorieGoal || DEFAULT_GOALS.calories,
    protein: profile.macroGoals?.protein || DEFAULT_GOALS.protein,
    carbs: profile.macroGoals?.carbs || DEFAULT_GOALS.carbs,
    fat: profile.macroGoals?.fat || DEFAULT_GOALS.fat,
  }), [profile]);

  const isPro = useMemo(() => checkIsProFn(profile), [profile]);
  const trialDaysRemaining = useMemo(() => calcTrialDays(profile), [profile]);

  return (
    <UserContext.Provider value={{
      profile, updateProfile, foodEntries, addFoodEntry, removeFoodEntry, updateFoodEntry,
      weightLogs, addWeightLog, waterLogs, setWaterForDate,
      habitLogs, toggleHabitForDate, habits, progressPhotos, saveProgressPhoto,
      favorites, toggleFavorite, customFoods, addCustomFood,
      mealPlan, saveMealPlan, groceryChecked, toggleGroceryItem,
      chatMessages, appendChatMessage, incrementUserMessageCount, clearChat, aiMessagesToday,
      searchIntent, setSearchIntent, getDayTotals, goals, isPro, trialDaysRemaining, loaded,
      activeFastStart, fastingLogs, startFast, endFast,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export { checkIsProFn as checkIsPro };

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
