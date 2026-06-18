import { searchUsda } from './providers/usda';
import { searchOpenFoodFacts } from './providers/openFoodFacts';
import { FOOD_API_CONFIG, isApiConfigured } from '../../config/foodApi';
import { searchLocal } from './providers/local';

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
}

export function dedupeFoods(foods) {
  const seen = new Set();
  return foods.filter((f) => {
    const key = normalizeName(f.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchMergedFoods(query, page = 1, signal) {
  const trimmed = query.trim();
  if (trimmed.length < FOOD_API_CONFIG.minQueryLength) return [];

  const opts = signal ? { signal } : {};
  const pageSize = FOOD_API_CONFIG.pageSize;

  try {
    const tasks = [];
    if (isApiConfigured() && FOOD_API_CONFIG.provider === 'usda') {
      tasks.push(searchUsda(trimmed, pageSize).catch(() => []));
    }
    tasks.push(searchOpenFoodFacts(trimmed, pageSize, page).catch(() => []));

    const batches = await Promise.all(tasks);
    let merged = dedupeFoods(batches.flat());
    if (merged.length === 0) merged = await searchLocal(trimmed, pageSize);
    return merged.slice(0, pageSize);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return searchLocal(trimmed, pageSize);
  }
}
