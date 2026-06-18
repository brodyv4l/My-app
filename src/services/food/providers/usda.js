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

function mapUsdaFood(food) {
  const nutrients = food.foodNutrients || [];
  const name = food.brandOwner
    ? `${food.description} (${food.brandOwner})`
    : food.description;

  return createFoodItem({
    id: `usda:${food.fdcId}`,
    name,
    brand: food.brandOwner || food.brandName || '',
    calories: nutrientValue(nutrients, 1008, 'Energy'),
    protein: nutrientValue(nutrients, 1003, 'Protein'),
    carbs: nutrientValue(nutrients, 1005, 'Carbohydrate, by difference'),
    fat: nutrientValue(nutrients, 1004, 'Total lipid (fat)'),
    serving: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit || 'g'}`
      : '100g',
    servingGrams: food.servingSize || 100,
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
