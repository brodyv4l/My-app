import { supabase, isSupabaseConfigured } from './supabase';
import { heightToCm } from '../utils/units';
import { DEFAULT_GOALS } from '../data/foods';

function cmToFeetInches(cm) {
  if (cm == null || cm === '') return { heightFeet: '', heightInches: '' };
  const totalIn = Number(cm) / 2.54;
  return {
    heightFeet: Math.floor(totalIn / 12),
    heightInches: Math.round(totalIn % 12),
  };
}

function logDate(row) {
  return row.date || row.logged_date;
}

function rowToEntry(row) {
  const serving = row.serving_size || row.serving || '1 serving';
  let servings = Number(row.servings) || 1;
  if (!row.servings && serving) {
    const m = String(serving).match(/^([\d.]+)/);
    if (m) servings = Number(m[1]) || 1;
  }
  return {
    id: row.id,
    foodId: row.food_id || undefined,
    name: row.food_name || row.name || 'Food',
    meal: row.meal_type || row.meal || 'snacks',
    servings,
    serving,
    servingAmount: row.serving_amount != null ? Number(row.serving_amount) : servings,
    servingUnit: row.serving_unit || 'serving',
    servingGrams: row.serving_grams != null ? Number(row.serving_grams) : undefined,
    calories: Math.round(Number(row.calories) || 0),
    protein: Math.round((Number(row.protein) || 0) * 10) / 10,
    carbs: Math.round((Number(row.carbs) || 0) * 10) / 10,
    fat: Math.round((Number(row.fat) || 0) * 10) / 10,
    imageUri: row.image_uri || undefined,
  };
}

function entryToRow(userId, date, entry) {
  return {
    id: entry.id?.includes('-') && entry.id.length > 20 ? entry.id : undefined,
    user_id: userId,
    date,
    meal_type: entry.meal || 'snacks',
    food_name: entry.name,
    serving_size: entry.serving || `${entry.servings ?? 1} serving`,
    serving_amount: entry.servingAmount ?? entry.servings ?? 1,
    serving_unit: entry.servingUnit || 'serving',
    serving_grams: entry.servingGrams ?? null,
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
  };
}

function profileFromUserRow(row) {
  if (!row) return null;
  const { heightFeet, heightInches } = cmToFeetInches(row.height_cm);
  return {
    name: row.name || '',
    avatarUrl: row.avatar_url || null,
    authProvider: row.auth_provider || 'email',
    googleId: row.google_id || null,
    onboardingComplete: !!row.onboarding_complete,
    age: row.age ?? '',
    heightFeet,
    heightInches,
    weight: row.weight_lbs ?? '',
    gender: row.sex || 'male',
    activityLevel: row.activity_level || '',
    goalType: row.goal || '',
    goalStrategy: row.pace || '',
    goalPace: row.pace || '',
    targetWeight: row.target_weight_lbs ?? '',
    targetDate: row.target_date || '',
    calorieGoal: row.daily_calories ?? DEFAULT_GOALS.calories,
    macroGoals: {
      protein: row.protein_goal ?? DEFAULT_GOALS.protein,
      carbs: row.carb_goal ?? DEFAULT_GOALS.carbs,
      fat: row.fat_goal ?? DEFAULT_GOALS.fat,
    },
    waterGoalOz: row.water_goal_oz ?? 0,
    subscriptionStatus: row.subscription_status || 'free',
    subscriptionPlan: row.subscription_plan || null,
    trialStartDate: row.trial_start_date || '',
    trialEndDate: row.trial_end_date || '',
    subscriptionStartDate: row.subscription_start_date || '',
    subscriptionEndDate: row.subscription_end_date || '',
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    accessCodeUsed: row.access_code_used || null,
    isFounder: !!row.is_founder,
    streakCount: row.streak_count ?? 0,
    streakStartDate: row.streak_start_date || '',
    lastLoggedDate: row.last_logged_date || '',
    showSobrietyTracker: !!row.show_sobriety_tracker,
    sobrietyStreakCount: row.sobriety_streak_count ?? 0,
    sobrietyLastCleanDate: row.sobriety_last_clean_date || '',
  };
}

function profileFromProfilesRow(data) {
  if (!data) return null;
  return {
    ...data.profile,
    onboardingComplete: data.onboarding_complete ?? data.profile?.onboardingComplete ?? false,
  };
}

function userRowFromProfile(userId, profile, email) {
  const hasHeight = profile.heightFeet !== undefined && profile.heightFeet !== '';
  const row = {
    id: userId,
    name: profile.name || '',
    avatar_url: profile.avatarUrl || null,
    auth_provider: profile.authProvider || 'email',
    google_id: profile.googleId || null,
    onboarding_complete: !!profile.onboardingComplete,
    age: profile.age ? Number(profile.age) : null,
    height_cm: hasHeight ? Math.round(heightToCm(profile.heightFeet, profile.heightInches || 0)) : null,
    weight_lbs: profile.weight ? Number(profile.weight) : null,
    sex: profile.gender || null,
    activity_level: profile.activityLevel || null,
    goal: profile.goalType || null,
    pace: profile.goalStrategy || profile.goalPace || null,
    target_weight_lbs: profile.targetWeight ? Number(profile.targetWeight) : null,
    target_date: profile.targetDate || null,
    daily_calories: profile.calorieGoal ?? null,
    protein_goal: profile.macroGoals?.protein ?? null,
    carb_goal: profile.macroGoals?.carbs ?? null,
    fat_goal: profile.macroGoals?.fat ?? null,
    water_goal_oz: profile.waterGoalOz ?? null,
    subscription_status: profile.subscriptionStatus || 'free',
    subscription_plan: profile.subscriptionPlan || null,
    trial_start_date: profile.trialStartDate || null,
    trial_end_date: profile.trialEndDate || null,
    subscription_start_date: profile.subscriptionStartDate || null,
    subscription_end_date: profile.subscriptionEndDate || null,
    stripe_customer_id: profile.stripeCustomerId || null,
    stripe_subscription_id: profile.stripeSubscriptionId || null,
    access_code_used: profile.accessCodeUsed || null,
    is_founder: !!profile.isFounder,
    streak_count: profile.streakCount ?? 0,
    streak_start_date: profile.streakStartDate || null,
    last_logged_date: profile.lastLoggedDate || null,
    show_sobriety_tracker: !!profile.showSobrietyTracker,
    sobriety_streak_count: profile.sobrietyStreakCount ?? 0,
    sobriety_last_clean_date: profile.sobrietyLastCleanDate || null,
  };
  if (email) row.email = email;
  return row;
}

export function canUseSupabaseData(user) {
  return isSupabaseConfigured && user?.provider === 'supabase' && user?.uid;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSupabaseLogId(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}

function mergeCloudProfiles(userProfile, profilesProfile) {
  if (!userProfile) return profilesProfile;
  if (!profilesProfile) return userProfile;

  const userDone = !!userProfile.onboardingComplete
    || !!(userProfile.goalType && userProfile.age && Number(userProfile.calorieGoal) > 0);
  const profilesDone = !!profilesProfile.onboardingComplete
    || !!(profilesProfile.goalType && profilesProfile.age && Number(profilesProfile.calorieGoal) > 0);

  if (profilesDone && !userDone) {
    return {
      ...userProfile,
      ...profilesProfile,
      onboardingComplete: true,
      surveyCompletedAt: profilesProfile.surveyCompletedAt || userProfile.surveyCompletedAt,
    };
  }

  if (userDone && !profilesDone) {
    return {
      ...profilesProfile,
      ...userProfile,
      onboardingComplete: true,
      surveyCompletedAt: userProfile.surveyCompletedAt || profilesProfile.surveyCompletedAt,
    };
  }

  return {
    ...userProfile,
    ...profilesProfile,
    onboardingComplete: userDone || profilesDone || userProfile.onboardingComplete || profilesProfile.onboardingComplete,
    surveyCompletedAt: profilesProfile.surveyCompletedAt || userProfile.surveyCompletedAt,
  };
}

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured) return null;

  let userProfile = null;
  let profilesProfile = null;

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!userErr && userRow) {
    userProfile = profileFromUserRow(userRow);
  } else if (userErr && !userErr.message.includes('does not exist')) {
    console.warn('fetchProfile users:', userErr.message);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('profile, onboarding_complete')
    .eq('user_id', userId)
    .maybeSingle();

  if (!error && data) {
    profilesProfile = profileFromProfilesRow(data);
  } else if (error && !error.message.includes('does not exist')) {
    console.warn('fetchProfile profiles:', error.message);
  }

  return mergeCloudProfiles(userProfile, profilesProfile);
}

export async function upsertProfile(userId, profile, email) {
  if (!isSupabaseConfigured) return;

  const userPayload = userRowFromProfile(userId, profile, email);
  const { error: userErr } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });

  if (userErr && !userErr.message.includes('does not exist')) {
    console.warn('upsertProfile users:', userErr.message);
  }

  const { onboardingComplete, ...rest } = profile;
  const { error: profilesErr } = await supabase.from('profiles').upsert({
    user_id: userId,
    onboarding_complete: !!onboardingComplete,
    profile: { ...rest, onboardingComplete: !!onboardingComplete },
    updated_at: new Date().toISOString(),
  });
  if (profilesErr && !profilesErr.message.includes('does not exist')) {
    console.warn('upsertProfile profiles:', profilesErr.message);
  }
}

/** Create a starter profile row for new Supabase users. */
export async function ensureUserProfile(userId, authUser) {
  if (!isSupabaseConfigured || !userId) return null;
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const meta = authUser?.user_metadata || {};
  const starter = {
    name: meta.full_name || meta.name || '',
    avatarUrl: meta.avatar_url || meta.picture || null,
    authProvider: authUser?.app_metadata?.provider || 'email',
    onboardingComplete: false,
    subscriptionStatus: 'free',
    themeMode: 'dark',
  };
  await upsertProfile(userId, starter, authUser?.email);
  return { ...starter, onboardingComplete: false };
}

export async function fetchFoodLogs(userId, date) {
  if (!isSupabaseConfigured) return null;
  let query = supabase.from('food_logs').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (date) query = query.eq('date', date);
  const { data, error } = await query;
  if (error) {
    console.warn('fetchFoodLogs:', error.message);
    return null;
  }
  if (date) return (data || []).map(rowToEntry);
  const grouped = {};
  (data || []).forEach((row) => {
    const d = logDate(row);
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(rowToEntry(row));
  });
  return grouped;
}

export async function insertFoodLog(userId, date, entry) {
  if (!isSupabaseConfigured) return entry;
  const payload = entryToRow(userId, date, entry);
  delete payload.id;
  const { data, error } = await supabase.from('food_logs').insert(payload).select('*').single();
  if (error) {
    console.warn('insertFoodLog:', error.message);
    return entry;
  }
  return rowToEntry(data);
}

export async function updateFoodLog(entryId, updates) {
  if (!isSupabaseConfigured || !entryId) return;
  const patch = {};
  if (updates.name != null) patch.food_name = updates.name;
  if (updates.meal != null) patch.meal_type = updates.meal;
  if (updates.serving != null) patch.serving_size = updates.serving;
  if (updates.servingAmount != null) patch.serving_amount = updates.servingAmount;
  if (updates.servingUnit != null) patch.serving_unit = updates.servingUnit;
  if (updates.servingGrams != null) patch.serving_grams = updates.servingGrams;
  if (updates.servings != null && updates.serving == null) {
    patch.serving_size = `${updates.servings} serving${updates.servings === 1 ? '' : 's'}`;
  }
  if (updates.calories != null) patch.calories = updates.calories;
  if (updates.protein != null) patch.protein = updates.protein;
  if (updates.carbs != null) patch.carbs = updates.carbs;
  if (updates.fat != null) patch.fat = updates.fat;
  const { error } = await supabase.from('food_logs').update(patch).eq('id', entryId);
  if (error) console.warn('updateFoodLog:', error.message);
}

export async function deleteFoodLog(entryId) {
  if (!isSupabaseConfigured || !entryId) return;
  const { error } = await supabase.from('food_logs').delete().eq('id', entryId);
  if (error) console.warn('deleteFoodLog:', error.message);
}

function weightLogFromRow(row) {
  return {
    id: row.id,
    date: row.date || row.logged_date,
    weight: Number(row.weight_lbs ?? row.weight ?? 0),
    createdAt: row.created_at || null,
    photoUri: row.photo_uri || null,
  };
}

export async function fetchWeightLogs(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('fetchWeightLogs:', error.message);
    return null;
  }
  return (data || []).map(weightLogFromRow);
}

export async function insertWeightLog(userId, log) {
  if (!isSupabaseConfigured || !userId) return log;
  const payload = {
    id: log.id,
    user_id: userId,
    date: log.date,
    weight_lbs: log.weight,
    created_at: log.createdAt || new Date().toISOString(),
    photo_uri: log.photoUri || null,
  };
  const { data, error } = await supabase.from('weight_logs').insert(payload).select('*').single();
  if (error) {
    console.warn('insertWeightLog:', error.message);
    return log;
  }
  return weightLogFromRow(data);
}

function savedFoodFromRow(row) {
  return row.food_data || row.food || null;
}

export async function fetchSavedFoods(userId) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('saved_foods').select('*').eq('user_id', userId);
  if (error) {
    console.warn('fetchSavedFoods:', error.message);
    return null;
  }
  return (data || []).map(savedFoodFromRow).filter(Boolean);
}

export async function upsertSavedFood(userId, food) {
  if (!isSupabaseConfigured || !food?.id) return;

  const { data: existing } = await supabase
    .from('saved_foods')
    .select('id')
    .eq('user_id', userId)
    .filter('food_data->>id', 'eq', String(food.id))
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('saved_foods').update({ food_data: food }).eq('id', existing.id);
    if (error) console.warn('upsertSavedFood update:', error.message);
    return;
  }

  const { error } = await supabase.from('saved_foods').insert({
    user_id: userId,
    food_data: food,
  });
  if (error) console.warn('upsertSavedFood insert:', error.message);
}

export async function deleteSavedFood(userId, foodId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('saved_foods')
    .delete()
    .eq('user_id', userId)
    .filter('food_data->>id', 'eq', String(foodId));
  if (error) console.warn('deleteSavedFood:', error.message);
}

export async function migrateLocalFoodLogs(userId, localEntries) {
  if (!isSupabaseConfigured || !localEntries) return;
  const rows = [];
  Object.entries(localEntries).forEach(([date, entries]) => {
    (entries || []).forEach((entry) => {
      rows.push(entryToRow(userId, date, entry));
    });
  });
  if (!rows.length) return;
  rows.forEach((r) => delete r.id);
  const { error } = await supabase.from('food_logs').insert(rows);
  if (error) console.warn('migrateLocalFoodLogs:', error.message);
}

function fastingLogFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    startTime: row.start_time,
    endTime: row.end_time,
    durationHours: row.duration_hours,
    date: row.date,
    createdAt: row.created_at,
  };
}

export async function fetchFastingLogs(userId, limit = 20) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('fasting_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (!error.message.includes('does not exist')) console.warn('fetchFastingLogs:', error.message);
    return null;
  }
  return (data || []).map(fastingLogFromRow);
}

export async function insertFastingLog(userId, log) {
  if (!isSupabaseConfigured || !userId) return log;
  const payload = {
    user_id: userId,
    start_time: log.startTime,
    end_time: log.endTime,
    duration_hours: log.durationHours,
    date: log.date,
  };
  const { data, error } = await supabase.from('fasting_logs').insert(payload).select('*').single();
  if (error) {
    if (!error.message.includes('does not exist')) console.warn('insertFastingLog:', error.message);
    return log;
  }
  return fastingLogFromRow(data);
}
