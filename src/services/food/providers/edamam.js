import { FOOD_API_CONFIG } from '../../../config/foodApi';
import { createFoodItem, nutrientValue } from '../normalize';

const BASE = 'https://api.edamam.com/api/food-database/v2';

async function edamamFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('app_id', FOOD_API_CONFIG.appId);
  url.searchParams.set('app_key', FOOD_API_CONFIG.apiKey);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Edamam API error: ${res.status}`);
  return res.json();
}

function mapEdamamHint(hint) {
  const food = hint.food;
  const nutrients = food.nutrients || {};
  const label = food.brand ? `${food.label} (${food.brand})` : food.label;

  return createFoodItem({
    id: `edamam:${food.foodId}`,
    name: label,
    brand: food.brand || '',
    calories: nutrients.ENERC_KCAL ?? 0,
    protein: nutrients.PROCNT ?? 0,
    carbs: nutrients.CHOCDF ?? 0,
    fat: nutrients.FAT ?? 0,
    serving: '100g',
    servingGrams: 100,
    source: 'edamam',
    needsDetail: !nutrients.ENERC_KCAL,
    raw: { foodId: food.foodId },
  });
}

export async function searchEdamam(query, limit = 20) {
  const data = await edamamFetch('/parser', {
    ingr: query,
    'nutrition-type': 'cooking',
  });

  return (data.hints || []).slice(0, limit).map(mapEdamamHint);
}

export async function getEdamamDetails(food) {
  const foodId = food.raw?.foodId || food.id.replace('edamam:', '');
  const data = await edamamFetch('', {
    ingr: `food_id:${foodId}`,
    'nutrition-type': 'cooking',
  });
  const hint = data.hints?.[0];
  return hint ? mapEdamamHint(hint) : food;
}
