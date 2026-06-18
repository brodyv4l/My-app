import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_MODEL = 'claude-haiku-4-5-20251001';

function getWeekString() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

function parseAiJson(text) {
  const clean = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse meal plan from AI. Try again.');
  }
}

function normalizeProfile(userProfile) {
  return {
    dailyCalories: userProfile.calorieGoal || userProfile.dailyCalories || 2000,
    proteinGoal: userProfile.macroGoals?.protein || userProfile.proteinGoal || 150,
    carbGoal: userProfile.macroGoals?.carbs || userProfile.carbGoal || 200,
    fatGoal: userProfile.macroGoals?.fat || userProfile.fatGoal || 65,
    goal: userProfile.goalType || userProfile.goal || 'eat healthy',
  };
}

function seededShuffle(arr, seed) {
  const copy = [...arr];
  let s = Math.abs(Number(seed) || 1);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (Math.imul(1664525, s + i) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFallbackMealPool(userProfile, seed = Date.now()) {
  const np = normalizeProfile(userProfile);
  const bCal = Math.round(np.dailyCalories * 0.25);
  const lCal = Math.round(np.dailyCalories * 0.30);
  const dCal = Math.round(np.dailyCalories * 0.35);
  const sCal = Math.round(np.dailyCalories * 0.10);
  const mk = (id, name, calories, protein, carbs, fat, items) => ({
    id,
    name,
    calories,
    protein,
    carbs,
    fat,
    ingredients: items.map((item) => ({ item, amount: '1 serving' })),
    prepTime: '10 min',
    servingSize: '1 serving',
  });
  const full = {
    breakfast: [
      mk('B1', 'Greek Yogurt Bowl', bCal, Math.round(np.proteinGoal * 0.25), Math.round(np.carbGoal * 0.2), Math.round(np.fatGoal * 0.15), ['Greek yogurt', 'Berries', 'Granola']),
      mk('B2', 'Scrambled Eggs & Toast', bCal, Math.round(np.proteinGoal * 0.3), Math.round(np.carbGoal * 0.25), Math.round(np.fatGoal * 0.2), ['Eggs', 'Whole wheat toast', 'Butter']),
      mk('B3', 'Oatmeal with Banana', bCal, Math.round(np.proteinGoal * 0.2), Math.round(np.carbGoal * 0.3), Math.round(np.fatGoal * 0.1), ['Oats', 'Banana', 'Peanut butter']),
      mk('B4', 'Avocado Toast & Eggs', bCal, Math.round(np.proteinGoal * 0.28), Math.round(np.carbGoal * 0.22), Math.round(np.fatGoal * 0.22), ['Avocado', 'Eggs', 'Sourdough']),
      mk('B5', 'Protein Pancakes', bCal, Math.round(np.proteinGoal * 0.32), Math.round(np.carbGoal * 0.28), Math.round(np.fatGoal * 0.12), ['Protein powder', 'Oats', 'Banana']),
      mk('B6', 'Veggie Omelette', bCal, Math.round(np.proteinGoal * 0.3), Math.round(np.carbGoal * 0.15), Math.round(np.fatGoal * 0.18), ['Eggs', 'Spinach', 'Peppers']),
    ],
    lunch: [
      mk('L1', 'Chicken Rice Bowl', lCal, Math.round(np.proteinGoal * 0.35), Math.round(np.carbGoal * 0.35), Math.round(np.fatGoal * 0.2), ['Chicken breast', 'Rice', 'Broccoli']),
      mk('L2', 'Turkey Wrap', lCal, Math.round(np.proteinGoal * 0.3), Math.round(np.carbGoal * 0.3), Math.round(np.fatGoal * 0.25), ['Turkey', 'Tortilla', 'Lettuce', 'Avocado']),
      mk('L3', 'Tuna Salad Plate', lCal, Math.round(np.proteinGoal * 0.35), Math.round(np.carbGoal * 0.25), Math.round(np.fatGoal * 0.25), ['Tuna', 'Mixed greens', 'Olive oil']),
      mk('L4', 'Quinoa Buddha Bowl', lCal, Math.round(np.proteinGoal * 0.28), Math.round(np.carbGoal * 0.38), Math.round(np.fatGoal * 0.22), ['Quinoa', 'Chickpeas', 'Roasted vegetables']),
      mk('L5', 'Grilled Chicken Salad', lCal, Math.round(np.proteinGoal * 0.38), Math.round(np.carbGoal * 0.2), Math.round(np.fatGoal * 0.24), ['Chicken', 'Mixed greens', 'Tomatoes', 'Feta']),
      mk('L6', 'Black Bean Burrito Bowl', lCal, Math.round(np.proteinGoal * 0.25), Math.round(np.carbGoal * 0.4), Math.round(np.fatGoal * 0.2), ['Black beans', 'Rice', 'Corn', 'Salsa']),
    ],
    dinner: [
      mk('D1', 'Salmon with Sweet Potato', dCal, Math.round(np.proteinGoal * 0.4), Math.round(np.carbGoal * 0.35), Math.round(np.fatGoal * 0.3), ['Salmon', 'Sweet potato', 'Asparagus']),
      mk('D2', 'Lean Beef Stir Fry', dCal, Math.round(np.proteinGoal * 0.35), Math.round(np.carbGoal * 0.3), Math.round(np.fatGoal * 0.3), ['Lean beef', 'Mixed vegetables', 'Soy sauce']),
      mk('D3', 'Chicken Pasta Marinara', dCal, Math.round(np.proteinGoal * 0.35), Math.round(np.carbGoal * 0.4), Math.round(np.fatGoal * 0.25), ['Chicken', 'Pasta', 'Marinara sauce']),
      mk('D4', 'Turkey Meatballs & Zoodles', dCal, Math.round(np.proteinGoal * 0.38), Math.round(np.carbGoal * 0.25), Math.round(np.fatGoal * 0.28), ['Turkey', 'Zucchini noodles', 'Marinara']),
      mk('D5', 'Shrimp Tacos', dCal, Math.round(np.proteinGoal * 0.32), Math.round(np.carbGoal * 0.32), Math.round(np.fatGoal * 0.26), ['Shrimp', 'Corn tortillas', 'Slaw']),
      mk('D6', 'Baked Cod & Rice', dCal, Math.round(np.proteinGoal * 0.36), Math.round(np.carbGoal * 0.34), Math.round(np.fatGoal * 0.22), ['Cod', 'Brown rice', 'Green beans']),
    ],
    snack: [
      mk('S1', 'Protein Shake', sCal, Math.round(np.proteinGoal * 0.15), Math.round(np.carbGoal * 0.1), Math.round(np.fatGoal * 0.05), ['Protein powder', 'Almond milk']),
      mk('S2', 'Apple & Almonds', sCal, Math.round(np.proteinGoal * 0.05), Math.round(np.carbGoal * 0.15), Math.round(np.fatGoal * 0.15), ['Apple', 'Almonds']),
      mk('S3', 'Cottage Cheese Cup', sCal, Math.round(np.proteinGoal * 0.15), Math.round(np.carbGoal * 0.05), Math.round(np.fatGoal * 0.1), ['Cottage cheese']),
      mk('S4', 'Hummus & Veggies', sCal, Math.round(np.proteinGoal * 0.08), Math.round(np.carbGoal * 0.12), Math.round(np.fatGoal * 0.12), ['Hummus', 'Carrots', 'Celery']),
      mk('S5', 'Trail Mix', sCal, Math.round(np.proteinGoal * 0.06), Math.round(np.carbGoal * 0.14), Math.round(np.fatGoal * 0.14), ['Nuts', 'Dried fruit']),
      mk('S6', 'Hard Boiled Eggs', sCal, Math.round(np.proteinGoal * 0.18), Math.round(np.carbGoal * 0.02), Math.round(np.fatGoal * 0.12), ['Eggs']),
    ],
  };

  return {
    breakfast: seededShuffle(full.breakfast, seed).slice(0, 3),
    lunch: seededShuffle(full.lunch, seed + 1).slice(0, 3),
    dinner: seededShuffle(full.dinner, seed + 2).slice(0, 3),
    snack: seededShuffle(full.snack, seed + 3).slice(0, 3),
  };
}

export async function generateMealPool(userProfile, dietaryPrefs = [], previousMeals = [], seed = Date.now()) {
  const np = normalizeProfile(userProfile);
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('No Anthropic key — using fallback meal pool');
    return buildFallbackMealPool(userProfile, seed);
  }
  const restrictions = dietaryPrefs?.length > 0
    ? `Dietary requirements: ${dietaryPrefs.join(', ')}.`
    : 'No dietary restrictions.';
  const avoidList = (previousMeals || []).filter(Boolean).slice(0, 24);
  const avoidLine = avoidList.length
    ? `\nDo NOT repeat these recently used meals: ${avoidList.join(', ')}.`
    : '';

  const breakfastCals = Math.round(np.dailyCalories * 0.25);
  const lunchCals = Math.round(np.dailyCalories * 0.30);
  const dinnerCals = Math.round(np.dailyCalories * 0.35);
  const snackCals = Math.round(np.dailyCalories * 0.10);

  const prompt = `You are a meal prep nutritionist.
Create a simple practical weekly meal pool.

USER TARGETS:
Daily Calories: ${np.dailyCalories}
Protein: ${np.proteinGoal}g
Carbs: ${np.carbGoal}g
Fat: ${np.fatGoal}g
Goal: ${np.goal}
${restrictions}${avoidLine}

Create exactly 3 options per meal type.
Use simple common ingredients people already own.
Keep meals practical and easy to make.
Each meal must hit its calorie target exactly.

Calorie targets:
Breakfast: ${breakfastCals} cal
Lunch: ${lunchCals} cal
Dinner: ${dinnerCals} cal
Snack: ${snackCals} cal

Return ONLY raw JSON. No markdown:
{
  "breakfast": [
    {"id":"B1","name":"string","calories":${breakfastCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"B2","name":"string","calories":${breakfastCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"B3","name":"string","calories":${breakfastCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"}
  ],
  "lunch": [
    {"id":"L1","name":"string","calories":${lunchCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"L2","name":"string","calories":${lunchCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"L3","name":"string","calories":${lunchCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"}
  ],
  "dinner": [
    {"id":"D1","name":"string","calories":${dinnerCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"D2","name":"string","calories":${dinnerCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"D3","name":"string","calories":${dinnerCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"}
  ],
  "snack": [
    {"id":"S1","name":"string","calories":${snackCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"S2","name":"string","calories":${snackCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"},
    {"id":"S3","name":"string","calories":${snackCals},"protein":0,"carbs":0,"fat":0,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"}
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MEAL_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    console.warn('Meal pool API failed — using fallback');
    return buildFallbackMealPool(userProfile, seed);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  let pool;
  try {
    pool = parseAiJson(text);
  } catch (e) {
    console.warn('Meal pool parse failed — using fallback', e?.message);
    return buildFallbackMealPool(userProfile, seed);
  }

  // Guarantee at least 3 options per type so rotation never breaks.
  ['breakfast', 'lunch', 'dinner', 'snack'].forEach((type) => {
    let arr = Array.isArray(pool[type]) ? pool[type].filter(Boolean) : [];
    if (!arr.length) {
      throw new Error(`Meal plan missing ${type} options. Try again.`);
    }
    while (arr.length < 3) arr.push({ ...arr[arr.length - 1], id: `${arr[0].id || type}-${arr.length}` });
    pool[type] = arr;
  });
  return pool;
}

export function buildWeekFromPool(pool, rotationOffset = 0) {
  const rotation = [
    [0, 1, 2, 0],
    [1, 2, 0, 1],
    [2, 0, 1, 2],
    [0, 2, 1, 0],
    [1, 0, 2, 1],
    [2, 1, 0, 2],
    [0, 1, 0, 2],
  ];
  const offset = Math.abs(Number(rotationOffset) || 0) % 3;
  const pick = (list, index) => {
    const len = list?.length || 1;
    return list?.[index % len] || list?.[0] || { name: 'Meal', calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [] };
  };
  return DAY_NAMES.map((day, i) => {
    const [bi, li, di, si] = rotation[i];
    const breakfast = pick(pool.breakfast, bi + offset);
    const lunch = pick(pool.lunch, li + offset);
    const dinner = pick(pool.dinner, di + offset);
    const snack = pick(pool.snack, si + offset);
    return {
      day,
      totalCalories: (breakfast.calories || 0) + (lunch.calories || 0) + (dinner.calories || 0) + (snack.calories || 0),
      totalProtein: (breakfast.protein || 0) + (lunch.protein || 0) + (dinner.protein || 0) + (snack.protein || 0),
      totalCarbs: (breakfast.carbs || 0) + (lunch.carbs || 0) + (dinner.carbs || 0) + (snack.carbs || 0),
      totalFat: (breakfast.fat || 0) + (lunch.fat || 0) + (dinner.fat || 0) + (snack.fat || 0),
      meals: { breakfast, lunch, dinner, snack },
    };
  });
}

export async function generateMealPlan(userProfile, preferences = [], previousMeals = []) {
  const dietaryPrefs = preferences.length ? preferences : (userProfile.dietaryPreferences || []);
  const seed = Date.now();
  const pool = await generateMealPool(userProfile, dietaryPrefs, previousMeals, seed);
  const days = buildWeekFromPool(pool, seed % 3);
  const plan = { weekOf: getWeekString(), days, pool, generatedAt: new Date().toISOString() };

  try {
    await AsyncStorage.setItem('current_meal_pool', JSON.stringify(pool));
    await AsyncStorage.setItem('current_meal_plan', JSON.stringify(plan));
  } catch (e) {
    console.log('meal plan save failed:', e);
  }
  return plan;
}

export async function swapSingleMeal({ mealType, goal, targetCals, targetProtein, restrictions, currentMealName }) {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) throw new Error('API key required');

  const prompt = `Generate ONE ${mealType} meal for a ${goal} goal.
Must have: ${targetCals} calories ±30, ${targetProtein}g protein ±5g.
${restrictions}
Do NOT use: ${currentMealName}.
Return ONLY JSON: {"name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":[{"item":"string","amount":"string"}],"prepTime":"X min","servingSize":"string"}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MEAL_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = (data.content?.[0]?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

export function extractMealNames(plan) {
  const names = [];
  (plan?.days || []).forEach((d) => {
    Object.values(d.meals || {}).forEach((m) => { if (m?.name) names.push(m.name); });
  });
  return names;
}
