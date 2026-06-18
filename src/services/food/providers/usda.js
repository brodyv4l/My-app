import { FOOD_API_CONFIG } from '../../../config/foodApi';
import { createFoodItem, nutrientValue } from '../normalize';

const BASE = 'https://api.nal.usda.gov/fdc/v1';

async function usdaFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', FOOD_API_CONFIG.apiKey);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
  return res.json();
}

function isPer100gDataType(dataType) {
  const t = String(dataType || '');
  return t === 'Foundation'
    || t === 'SR Legacy'
    || t.startsWith('Survey')
    || t === 'Experimental';
}

function servingSizeToGrams(size, unit) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return null;
  const u = String(unit || 'g').trim().toLowerCase();
  if (u === 'g' || u === 'grm' || u === 'gm') return n;
  if (u === 'ml' || u === 'mlt') return n;
  if (u === 'oz' || u === 'onz') return n * 28.3495;
  return n;
}

function formatServingLabel(size, unit) {
  if (size == null || size === '') return '100g';
  const u = String(unit || 'g').trim();
  const n = Number(size);
  if (Number.isFinite(n) && Number.isInteger(n)) return `${n}${u}`;
  return `${size}${u}`;
}

/** USDA often lists Energy twice (kJ and kcal) — always prefer kcal. */
function energyKcal(nutrients) {
  if (!Array.isArray(nutrients)) return 0;
  const energy = nutrients.filter(
    (n) => n.nutrientId === 1008 || n.nutrientNumber === '208' || n.nutrientName === 'Energy',
  );
  const kcal = energy.find((n) => String(n.unitName || '').toUpperCase() === 'KCAL');
  if (kcal) return kcal.value ?? kcal.amount ?? 0;
  const kj = energy.find((n) => String(n.unitName || '').toUpperCase() === 'KJ');
  if (kj) return (kj.value ?? kj.amount ?? 0) / 4.184;
  const any = energy[0];
  return any?.value ?? any?.amount ?? 0;
}

function mapUsdaFood(food) {
  const nutrients = food.foodNutrients || [];
  const name = food.brandOwner
    ? `${food.description} (${food.brandOwner})`
    : food.description;

  const per100g = isPer100gDataType(food.dataType);
  const label = food.labelNutrients;
  const hasLabelServing = label && !per100g
    && (label.calories?.value != null || label.protein?.value != null);

  let calories = energyKcal(nutrients);
  let protein = nutrientValue(nutrients, 1003, 'Protein');
  let carbs = nutrientValue(nutrients, 1005, 'Carbohydrate, by difference');
  let fat = nutrientValue(nutrients, 1004, 'Total lipid (fat)');

  let servingGrams = 100;
  let serving = '100g';

  if (hasLabelServing) {
    if (label.calories?.value != null) calories = label.calories.value;
    if (label.protein?.value != null) protein = label.protein.value;
    if (label.carbohydrates?.value != null) carbs = label.carbohydrates.value;
    if (label.fat?.value != null) fat = label.fat.value;

    const grams = servingSizeToGrams(food.servingSize, food.servingSizeUnit);
    if (grams) {
      servingGrams = grams;
      serving = formatServingLabel(food.servingSize, food.servingSizeUnit);
    }
  } else {
    // Foundation/SR Legacy (and most search hits) are per 100g — keep base at 100g
    // so cup/ml/oz conversions scale correctly in PortionEditor.
    servingGrams = 100;
    serving = '100g';
  }

  return createFoodItem({
    id: `usda:${food.fdcId}`,
    name,
    brand: food.brandOwner || food.brandName || '',
    calories,
    protein,
    carbs,
    fat,
    serving,
    servingGrams,
    source: 'usda',
    needsDetail: !nutrients.length,
    raw: { fdcId: food.fdcId },
  });
}

export async function searchUsda(query, pageSize = 20) {
  const data = await usdaFetch('/foods/search', {
    query,
    pageSize,
    dataType: 'Branded,Foundation,SR Legacy',
  });

  return (data.foods || []).map(mapUsdaFood);
}

export async function getUsdaDetails(food) {
  const fdcId = food.raw?.fdcId || food.id.replace('usda:', '');
  const data = await usdaFetch(`/food/${fdcId}`);
  return mapUsdaFood(data);
}
