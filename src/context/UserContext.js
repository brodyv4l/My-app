import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { DEFAULT_GOALS } from '../data/foods';
import { normalizeProfileUnits } from '../utils/units';

const UserContext = createContext(null);

const defaultProfile = {
  name: '',
  age: '',
  heightFeet: '',
  heightInches: '',
  weight: '', // lbs
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
};

function storageKey(uid, key) {
  return `nutritrack-${uid}-${key}`;
}

export function UserProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [foodEntries, setFoodEntries] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [groceryChecked, setGroceryChecked] = useState({});
  const [loaded, setLoaded] = useState(false);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) { setLoaded(false); return; }
    setLoaded(false);
    Promise.all([
      AsyncStorage.getItem(storageKey(uid, 'profile')),
      AsyncStorage.getItem(storageKey(uid, 'foodEntries')),
      AsyncStorage.getItem(storageKey(uid, 'weightLogs')),
      AsyncStorage.getItem(storageKey(uid, 'favorites')),
      AsyncStorage.getItem(storageKey(uid, 'customFoods')),
      AsyncStorage.getItem(storageKey(uid, 'mealPlan')),
      AsyncStorage.getItem(storageKey(uid, 'groceryChecked')),
    ]).then(([p, f, w, fav, custom, mp, gc]) => {
      if (p) setProfile(normalizeProfileUnits({ ...defaultProfile, ...JSON.parse(p) }));
      else setProfile({ ...defaultProfile, name: user?.name || '' });
      if (f) setFoodEntries(JSON.parse(f));
      else setFoodEntries({});
      if (w) setWeightLogs(JSON.parse(w));
      else setWeightLogs([]);
      if (fav) setFavorites(JSON.parse(fav));
      else setFavorites([]);
      if (custom) setCustomFoods(JSON.parse(custom));
      else setCustomFoods([]);
      if (mp) setMealPlan(JSON.parse(mp));
      else setMealPlan(null);
      if (gc) setGroceryChecked(JSON.parse(gc));
      else setGroceryChecked({});
      setLoaded(true);
    });
  }, [uid, user?.name]);

  const persist = useCallback(async (key, value) => {
    if (!uid) return;
    await AsyncStorage.setItem(storageKey(uid, key), JSON.stringify(value));
  }, [uid]);

  const updateProfile = useCallback(async (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      persist('profile', next);
      return next;
    });
  }, [persist]);

  const addFoodEntry = useCallback((date, entry) => {
    setFoodEntries((prev) => {
      const next = { ...prev, [date]: [...(prev[date] || []), entry] };
      persist('foodEntries', next);
      return next;
    });
  }, [persist]);

  const removeFoodEntry = useCallback((date, id) => {
    setFoodEntries((prev) => {
      const next = { ...prev, [date]: (prev[date] || []).filter((e) => e.id !== id) };
      persist('foodEntries', next);
      return next;
    });
  }, [persist]);

  const addWeightLog = useCallback((log) => {
    setWeightLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== log.date);
      const next = [...filtered, log].sort((a, b) => a.date.localeCompare(b.date));
      persist('weightLogs', next);
      return next;
    });
  }, [persist]);

  const toggleFavorite = useCallback((food) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === food.id);
      const next = exists ? prev.filter((f) => f.id !== food.id) : [...prev, food];
      persist('favorites', next);
      return next;
    });
  }, [persist]);

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

  const getDayTotals = useCallback((date) => {
    const entries = foodEntries[date] || [];
    return entries.reduce((acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodEntries]);

  const goals = useMemo(() => ({
    calories: profile.calorieGoal || DEFAULT_GOALS.calories,
    protein: profile.macroGoals?.protein || DEFAULT_GOALS.protein,
    carbs: profile.macroGoals?.carbs || DEFAULT_GOALS.carbs,
    fat: profile.macroGoals?.fat || DEFAULT_GOALS.fat,
  }), [profile]);

  return (
    <UserContext.Provider value={{
      profile, updateProfile, foodEntries, addFoodEntry, removeFoodEntry,
      weightLogs, addWeightLog, favorites, toggleFavorite, customFoods, addCustomFood,
      mealPlan, saveMealPlan, groceryChecked, toggleGroceryItem, getDayTotals, goals, loaded,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);



