import { profileForCalculation } from '../utils/units';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export function isOpenAIConfigured() {
  return Boolean(OPENAI_KEY);
}

async function chat(messages, json = false) {
  if (!OPENAI_KEY) throw new Error('OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function visionChat(imageUri, prompt, base64, mime) {
  if (!OPENAI_KEY) throw new Error('OpenAI API key not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function analyzeFoodImage(imageUri, base64, mime) {
  if (!OPENAI_KEY) {
    return {
      foods: [{
        name: 'Detected Meal',
        calories: 450,
        protein: 25,
        carbs: 40,
        fat: 18,
        serving: '1 plate',
        confidence: 'low',
        note: 'Add OpenAI key for accurate AI detection',
      }],
    };
  }

  return visionChat(imageUri, `Analyze this food image. Identify visible food items and estimate nutrition per serving.
Return JSON: { foods: [{ name, calories, protein, carbs, fat, serving, confidence: "high"|"medium"|"low" }] }
Be realistic with portion sizes. If multiple items, list each separately.`, base64, mime);
}

export async function extractBarcodeFromImage(imageUri, base64, mime) {
  if (!OPENAI_KEY) {
    throw new Error('OpenAI key required to read barcodes from photos. Use live scanner or add API key.');
  }

  const result = await visionChat(imageUri, `Read the product barcode (UPC/EAN) from this packaging image.
Return JSON: { barcode: "digits only string" } or { barcode: null } if not visible.`, base64, mime);
  return result.barcode;
}

export async function generateCalorieTarget(profile) {
  const fallback = calculateCaloriesFallback(profile);
  if (!OPENAI_KEY) return { ...fallback, source: 'formula' };

  try {
    const prompt = `You are a nutrition expert. Based on this user profile, return JSON with keys: calories (number), protein (grams), carbs (grams), fat (grams), explanation (short string).
Profile (US units - weight in lbs, height as feet/inches): ${JSON.stringify(profile)}
Consider goalType (lose/gain/maintain), goalStrategy (lean_bulk or fast_cut when applicable), and target timeline when setting calories.`;
    const raw = await chat([
      { role: 'system', content: 'Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], true);
    const parsed = JSON.parse(raw);
    return {
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein),
      carbs: Math.round(parsed.carbs),
      fat: Math.round(parsed.fat),
      explanation: parsed.explanation || '',
      source: 'ai',
    };
  } catch {
    return { ...fallback, source: 'formula' };
  }
}

function goalCalorieAdjustment(profile) {
  if (profile.goalType === 'maintain') return 0;
  if (profile.goalType === 'lose') return profile.goalStrategy === 'fast_cut' ? -750 : -350;
  if (profile.goalType === 'gain') return profile.goalStrategy === 'fast_cut' ? 500 : 300;
  return 0;
}

export function calculateCaloriesFallback(profile) {
  const calc = profileForCalculation(profile);
  const weight = calc.weightKg;
  const height = calc.heightCm;
  const age = Number(profile.age) || 30;
  const isMale = profile.gender !== 'female';
  let bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9 };
  let tdee = bmr * (multipliers[profile.activityLevel] || 1.55);

  const adjustment = goalCalorieAdjustment(profile);
  tdee += adjustment;

  const calories = Math.round(tdee);
  const protein = Math.round(calc.weightLbs * 0.82);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return {
    calories,
    protein,
    carbs,
    fat,
    explanation: 'Calculated using Mifflin-St Jeor equation with your goal adjustment.',
    source: 'formula',
  };
}

export async function generateMealPlan(profile, goals) {
  if (!OPENAI_KEY) return generateMealPlanFallback(profile, goals);

  try {
    const prompt = `Create a 7-day meal plan. Return JSON: { days: [{ day, meals: [{ type: "breakfast"|"lunch"|"dinner"|"snack", name, calories, protein, carbs, fat, ingredients: string[] }] }], groceryList: string[] }
User: age ${profile.age}, goal ${profile.goalType}, ${goals.calories} cal/day, preferences: ${(profile.dietaryPreferences || []).join(', ') || 'none'}`;
    const raw = await chat([
      { role: 'system', content: 'You are a meal planning nutritionist. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], true);
    return JSON.parse(raw);
  } catch {
    return generateMealPlanFallback(profile, goals);
  }
}

function generateMealPlanFallback(profile, goals) {
  const templates = [
    { type: 'breakfast', name: 'Greek Yogurt Parfait with Berries', calories: 320, protein: 22, carbs: 38, fat: 8, ingredients: ['Greek yogurt', 'mixed berries', 'granola', 'honey'] },
    { type: 'lunch', name: 'Grilled Chicken Salad', calories: 450, protein: 38, carbs: 22, fat: 18, ingredients: ['chicken breast', 'mixed greens', 'olive oil', 'cherry tomatoes'] },
    { type: 'dinner', name: 'Salmon with Brown Rice & Broccoli', calories: 520, protein: 35, carbs: 45, fat: 20, ingredients: ['salmon fillet', 'brown rice', 'broccoli', 'lemon'] },
    { type: 'snack', name: 'Apple with Almond Butter', calories: 200, protein: 5, carbs: 24, fat: 10, ingredients: ['apple', 'almond butter'] },
  ];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
    day,
    meals: templates,
  }));
  return {
    days,
    groceryList: ['Chicken breast', 'Salmon', 'Greek yogurt', 'Mixed berries', 'Brown rice', 'Broccoli', 'Almond butter', 'Apples', 'Mixed greens', 'Granola'],
  };
}



