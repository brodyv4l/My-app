import { MEAL_TEMPLATES, MEAL_SLOTS, DAY_NAMES } from '../data/mealTemplates';
import { groupByAisle } from '../data/groceryAisles';

export const CALORIE_TOLERANCE = 50;

function scaleMeal(meal, factor) {
  const f = Math.max(0.5, Math.min(1.5, factor));
  return {
    ...meal,
    scale: Math.round(f * 100) / 100,
    calories: Math.round(meal.calories * f),
    protein: Math.round(meal.protein * f),
    carbs: Math.round(meal.carbs * f),
    fat: Math.round(meal.fat * f),
    servingNote: f === 1 ? '1 serving' : `${f}x serving`,
  };
}

function sumMeals(meals) {
  return meals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function templatesByType(type) {
  return MEAL_TEMPLATES.filter((m) => m.type === type);
}

function pickBestDayPlan(goals) {
  const slots = MEAL_SLOTS;
  let best = null;
  let bestScore = Infinity;

  const breakfastOpts = templatesByType('breakfast');
  const lunchOpts = templatesByType('lunch');
  const dinnerOpts = templatesByType('dinner');
  const snackOpts = templatesByType('snack');

  for (const b of breakfastOpts) {
    for (const l of lunchOpts) {
      for (const d of dinnerOpts) {
        for (const s of snackOpts) {
          const base = [b, l, d, s];
          const baseCals = sumMeals(base).calories;
          const factor = goals.calories / Math.max(baseCals, 1);

          for (const f of [factor * 0.95, factor, factor * 1.05, 1, 0.9, 1.1]) {
            const scaled = base.map((m) => scaleMeal(m, f));
            const totals = sumMeals(scaled);
            const calDiff = Math.abs(totals.calories - goals.calories);
            if (calDiff > CALORIE_TOLERANCE) continue;

            const macroDiff =
              Math.abs(totals.protein - goals.protein) +
              Math.abs(totals.carbs - goals.carbs) +
              Math.abs(totals.fat - goals.fat);

            const score = calDiff * 10 + macroDiff;
            if (score < bestScore) {
              bestScore = score;
              best = {
                meals: scaled.map((m) => ({
                  type: m.type,
                  name: m.name,
                  calories: m.calories,
                  protein: m.protein,
                  carbs: m.carbs,
                  fat: m.fat,
                  ingredients: m.ingredients,
                  serving: m.servingNote,
                })),
                totals,
                withinTolerance: calDiff <= CALORIE_TOLERANCE,
              };
            }
          }
        }
      }
    }
  }

  return best;
}

export function buildSyncedDayPlan(goals) {
  const plan = pickBestDayPlan(goals);
  if (plan) return plan;

  const fallback = MEAL_SLOTS.map((type) => templatesByType(type)[0]).filter(Boolean);
  const factor = goals.calories / Math.max(sumMeals(fallback).calories, 1);
  const scaled = fallback.map((m) => scaleMeal(m, factor));
  return {
    meals: scaled.map((m) => ({
      type: m.type,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      ingredients: m.ingredients,
      serving: m.servingNote,
    })),
    totals: sumMeals(scaled),
    withinTolerance: Math.abs(sumMeals(scaled).calories - goals.calories) <= CALORIE_TOLERANCE,
  };
}

export function buildSyncedWeekPlan(goals) {
  const dayPlan = buildSyncedDayPlan(goals);
  const days = DAY_NAMES.map((day) => ({ day, meals: dayPlan.meals, totals: dayPlan.totals }));
  const ingredients = [];
  days.forEach((d) => d.meals.forEach((m) => ingredients.push(...(m.ingredients || []))));
  const groceryGroups = groupByAisle(ingredients);
  const groceryList = groceryGroups.flatMap((g) => g.items);

  return {
    days,
    groceryList,
    groceryGroups,
    dailyTarget: goals,
    syncedAt: new Date().toISOString(),
  };
}

export function getDayPlanFromWeek(mealPlan, dayIndex = 0) {
  if (!mealPlan?.days?.length) return null;
  const day = mealPlan.days[dayIndex] || mealPlan.days[0];
  const totals = day.totals || sumMeals(day.meals || []);
  return { ...day, totals };
}
