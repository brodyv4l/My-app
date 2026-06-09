import { FOOD_API_CONFIG, isApiConfigured } from '../../config/foodApi';
import { searchLocal } from './providers/local';
import { searchUsda, getUsdaDetails } from './providers/usda';
import { searchNutritionix, getNutritionixDetails } from './providers/nutritionix';
import { searchEdamam, getEdamamDetails } from './providers/edamam';
import { searchCustom, getCustomDetails } from './providers/custom';

async function viaProxy(action, query, food) {
  const { proxyUrl } = FOOD_API_CONFIG;
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, query, food, provider: FOOD_API_CONFIG.provider }),
  });
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  const data = await res.json();
  return data.foods || data.results || data;
}

export async function searchFoods(query) {
  const trimmed = query.trim();
  if (trimmed.length < FOOD_API_CONFIG.minQueryLength) return [];

  if (FOOD_API_CONFIG.proxyUrl) {
    try {
      return await viaProxy('search', trimmed);
    } catch {
      return searchLocal(trimmed, FOOD_API_CONFIG.pageSize);
    }
  }

  if (!isApiConfigured()) {
    return searchLocal(trimmed, FOOD_API_CONFIG.pageSize);
  }

  const { provider, pageSize } = FOOD_API_CONFIG;

  try {
    let results = [];
    if (provider === 'usda') results = await searchUsda(trimmed, pageSize);
    else if (provider === 'nutritionix') results = await searchNutritionix(trimmed);
    else if (provider === 'edamam') results = await searchEdamam(trimmed, pageSize);
    else if (provider === 'custom') results = await searchCustom(trimmed, pageSize);
    else if (provider === 'local') results = await searchLocal(trimmed, pageSize);

    if (results.length === 0) {
      const local = await searchLocal(trimmed, 5);
      return local;
    }
    return results;
  } catch (err) {
    console.warn('Food API search failed, using local fallback:', err.message);
    return searchLocal(trimmed, FOOD_API_CONFIG.pageSize);
  }
}

export async function enrichFood(food) {
  if (!food?.needsDetail) return food;

  if (FOOD_API_CONFIG.proxyUrl) {
    try {
      const result = await viaProxy('detail', null, food);
      return result.food || result;
    } catch {
      return food;
    }
  }

  try {
    if (food.source === 'usda') return await getUsdaDetails(food);
    if (food.source === 'nutritionix') return await getNutritionixDetails(food);
    if (food.source === 'edamam') return await getEdamamDetails(food);
    if (food.source === 'custom') return await getCustomDetails(food);
  } catch (err) {
    console.warn('Food detail fetch failed:', err.message);
  }
  return food;
}

export function getActiveProvider() {
  if (FOOD_API_CONFIG.proxyUrl) return `proxy (${FOOD_API_CONFIG.provider})`;
  if (!isApiConfigured()) return 'local (add API key to unlock millions of foods)';
  return FOOD_API_CONFIG.provider;
}
