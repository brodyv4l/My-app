/**
 * @typedef {Object} FoodItem
 * @property {string} id
 * @property {string} name
 * @property {string} [brand]
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {string} serving
 * @property {number} [servingGrams]
 * @property {string} source
 * @property {boolean} [needsDetail]
 * @property {Object} [raw]
 */

export function createFoodItem(partial) {
  return {
    id: partial.id,
    name: partial.name,
    brand: partial.brand || '',
    calories: round(partial.calories),
    protein: round(partial.protein),
    carbs: round(partial.carbs),
    fat: round(partial.fat),
    serving: partial.serving || '1 serving',
    servingGrams: partial.servingGrams,
    source: partial.source || 'unknown',
    needsDetail: partial.needsDetail || false,
    raw: partial.raw,
  };
}

function round(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

export function nutrientValue(nutrients, id, nameFallback) {
  if (!Array.isArray(nutrients)) return 0;
  const match = nutrients.find(
    (n) => n.nutrientId === id || n.nutrientNumber === String(id) || n.nutrientName === nameFallback
  );
  return match?.value ?? match?.amount ?? 0;
}
