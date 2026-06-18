import { calculateCaloriesFallback } from './openai';
import { profileForCalculation } from '../utils/units';
import { calculateMacroGoals } from '../utils/onboardingPlan';

const KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';

export async function recalculateGoalsWithClaude(profile) {
  const fallback = calculateCaloriesFallback(profile);
  if (!KEY) {
    const calc = profileForCalculation(profile);
    const goal = profile.goalType || 'maintain';
    const pace = profile.goalPace || profile.goalStrategy || 'moderate';
    const macros = calculateMacroGoals(fallback.calories, goal, pace, calc.weightLbs);
    return {
      ...fallback,
      ...macros,
      bmr: estimateBmr(profile),
      tdee: fallback.calories,
      method: 'mifflin-st-jeor',
    };
  }

  const calc = profileForCalculation(profile);
  const prompt = `You are a sports nutritionist. Use the Mifflin-St Jeor equation for BMR and activity multiplier for TDEE.
Calculate protein as exactly bodyweight(lbs) × [0.8 to 1.2 depending on goal], never higher. Then split remaining calories between carbs and fat.
Return ONLY valid JSON with keys:
bmr (number), tdee (number), calories (number), protein (number), carbs (number), fat (number), explanation (string), method ("mifflin-st-jeor").
Profile: ${JSON.stringify({
    age: profile.age,
    gender: profile.gender,
    weightLbs: calc.weightLbs,
    heightCm: calc.heightCm,
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
    goalStrategy: profile.goalStrategy,
    goalPace: profile.goalPace,
  })}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error('claude_error');
    const data = await response.json();
    const text = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return {
      bmr: Math.round(parsed.bmr || fallback.calories * 0.7),
      tdee: Math.round(parsed.tdee || fallback.calories),
      calories: Math.round(parsed.calories || fallback.calories),
      protein: Math.round(parsed.protein || fallback.protein),
      carbs: Math.round(parsed.carbs || fallback.carbs),
      fat: Math.round(parsed.fat || fallback.fat),
      explanation: parsed.explanation || fallback.explanation,
      method: parsed.method || 'mifflin-st-jeor',
    };
  } catch {
    const weightLbs = calc.weightLbs;
    const goal = profile.goalType || 'maintain';
    const pace = profile.goalPace || profile.goalStrategy || 'moderate';
    const macros = calculateMacroGoals(fallback.calories, goal, pace, weightLbs);
    return {
      ...fallback,
      ...macros,
      bmr: estimateBmr(profile),
      tdee: fallback.calories,
      method: 'mifflin-st-jeor',
    };
  }
}

function estimateBmr(profile) {
  const calc = profileForCalculation(profile);
  const age = Number(profile.age) || 30;
  const isMale = profile.gender !== 'female';
  if (isMale) return Math.round(10 * calc.weightKg + 6.25 * calc.heightCm - 5 * age + 5);
  return Math.round(10 * calc.weightKg + 6.25 * calc.heightCm - 5 * age - 161);
}
