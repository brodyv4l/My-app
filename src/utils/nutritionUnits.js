const GRAM_CONVERSIONS = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  oz: 28.3495,
  lb: 453.592,
  ml: 1,
  L: 1000,
  'fl oz': 29.5735,
  cup: 236.588,
  tbsp: 14.7868,
  tsp: 4.92892,
};

export const COUNT_UNITS = ['serving', 'piece', 'slice'];

export const UNIT_GROUPS = {
  weight: ['g', 'kg', 'mg', 'oz', 'lb'],
  volume: ['ml', 'L', 'fl oz', 'cup', 'tbsp', 'tsp'],
  count: COUNT_UNITS,
};

export const ALL_UNITS = [...UNIT_GROUPS.weight, ...UNIT_GROUPS.volume, ...UNIT_GROUPS.count];

export function isCountUnit(unit) {
  return COUNT_UNITS.includes(unit);
}

export function convertToGrams(amount, unit) {
  const n = Number(amount) || 0;
  if (isCountUnit(unit)) return n;
  return n * (GRAM_CONVERSIONS[unit] || 1);
}

export function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

/**
 * Scale nutrition from a food's base serving.
 * baseFood should have calories/protein/carbs/fat for one base serving.
 */
export function calculateNutrition(baseFood, amount, unit) {
  const amt = Number(amount) || 0;
  const base = {
    calories: Number(baseFood?.calories) || 0,
    protein: Number(baseFood?.protein) || 0,
    carbs: Number(baseFood?.carbs) || 0,
    fat: Number(baseFood?.fat) || 0,
  };

  if (isCountUnit(unit)) {
    const multiplier = amt;
    return {
      calories: Math.round(base.calories * multiplier),
      protein: round1(base.protein * multiplier),
      carbs: round1(base.carbs * multiplier),
      fat: round1(base.fat * multiplier),
      servingGrams: baseFood?.baseServingGrams || baseFood?.servingGrams || null,
      factor: multiplier,
    };
  }

  const grams = convertToGrams(amt, unit);
  const baseGrams = Number(baseFood?.baseServingGrams || baseFood?.servingGrams) || 100;
  const multiplier = baseGrams > 0 ? grams / baseGrams : 0;

  return {
    calories: Math.round(base.calories * multiplier),
    protein: round1(base.protein * multiplier),
    carbs: round1(base.carbs * multiplier),
    fat: round1(base.fat * multiplier),
    servingGrams: round1(grams),
    factor: round1(multiplier),
  };
}

export function formatPortionLabel(amount, unit) {
  const n = Number(amount) || 0;
  if (isCountUnit(unit)) {
    if (unit === 'serving') return n === 1 ? '1 serving' : `${n} servings`;
    return `${n} ${unit}${n === 1 ? '' : 's'}`;
  }
  return `${n} ${unit}`;
}

export function inferDefaultUnit(food) {
  if (food?.servingUnit && ALL_UNITS.includes(food.servingUnit)) return food.servingUnit;
  const serving = String(food?.serving || '').toLowerCase();
  if (serving.includes('ml')) return 'ml';
  if (serving.includes(' oz')) return 'oz';
  if (serving.includes(' cup')) return 'cup';
  if (serving.includes('g') && !serving.includes('kg')) return 'g';
  return 'serving';
}

export function portionFromEntry(entry) {
  if (entry?.servingAmount != null && entry?.servingUnit) {
    return { amount: Number(entry.servingAmount), unit: entry.servingUnit };
  }
  const servings = Number(entry?.servings) || 1;
  return { amount: servings, unit: 'serving' };
}
