import { FOOD_API_CONFIG } from '../../../config/foodApi';
import { createFoodItem } from '../normalize';

const BASE = 'https://trackapi.nutritionix.com/v2';

function nutritionixHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-app-id': FOOD_API_CONFIG.appId,
    'x-app-key': FOOD_API_CONFIG.apiKey,
  };
}

async function nutritionixFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...nutritionixHeaders(), ...options.headers },
  });
  if (!res.ok) throw new Error(`Nutritionix API error: ${res.status}`);
  return res.json();
}

function mapBranded(item) {
  return createFoodItem({
    id: `nutritionix:${item.nix_item_id}`,
    name: item.food_name,
    brand: item.brand_name || item.brand_name_item_name || '',
    calories: item.nf_calories ?? 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving: item.serving_qty && item.serving_unit
      ? `${item.serving_qty} ${item.serving_unit}`
      : '1 serving',
    source: 'nutritionix',
    needsDetail: true,
    raw: { nix_item_id: item.nix_item_id, type: 'branded' },
  });
}

function mapCommon(item) {
  return createFoodItem({
    id: `nutritionix:common:${item.tag_id}`,
    name: item.food_name,
    brand: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving: item.serving_unit || '1 serving',
    source: 'nutritionix',
    needsDetail: true,
    raw: { tag_id: item.tag_id, type: 'common', query: item.food_name },
  });
}

export async function searchNutritionix(query) {
  const data = await nutritionixFetch(`/search/instant?query=${encodeURIComponent(query)}`);
  const branded = (data.branded || []).slice(0, 15).map(mapBranded);
  const common = (data.common || []).slice(0, 10).map(mapCommon);
  return [...branded, ...common];
}

export async function getNutritionixDetails(food) {
  const { raw } = food;
  if (!raw) return food;

  if (raw.type === 'branded' && raw.nix_item_id) {
    const data = await nutritionixFetch('/search/item', {
      method: 'POST',
      body: JSON.stringify({ nix_item_id: raw.nix_item_id }),
    });
    const item = data.foods?.[0];
    if (!item) return food;
    return createFoodItem({
      id: food.id,
      name: item.food_name,
      brand: item.brand_name || food.brand,
      calories: item.nf_calories ?? 0,
      protein: item.nf_protein ?? 0,
      carbs: item.nf_total_carbohydrate ?? 0,
      fat: item.nf_total_fat ?? 0,
      serving: item.serving_qty && item.serving_unit
        ? `${item.serving_qty} ${item.serving_unit}`
        : food.serving,
      source: 'nutritionix',
      raw,
    });
  }

  if (raw.type === 'common') {
    const data = await nutritionixFetch('/natural/nutrients', {
      method: 'POST',
      body: JSON.stringify({ query: raw.query || food.name }),
    });
    const item = data.foods?.[0];
    if (!item) return food;
    return createFoodItem({
      id: food.id,
      name: item.food_name || food.name,
      brand: '',
      calories: item.nf_calories ?? 0,
      protein: item.nf_protein ?? 0,
      carbs: item.nf_total_carbohydrate ?? 0,
      fat: item.nf_total_fat ?? 0,
      serving: item.serving_qty && item.serving_unit
        ? `${item.serving_qty} ${item.serving_unit}`
        : food.serving,
      source: 'nutritionix',
      raw,
    });
  }

  return food;
}
