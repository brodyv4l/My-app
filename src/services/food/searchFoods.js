import { FOOD_API_CONFIG, isApiConfigured } from '../../config/foodApi';
import { searchMergedFoods, dedupeFoods } from './mergeSearch';
import { enrichFood as enrichFoodDetail } from './enrichFood';

export async function searchFoods(query, page = 1, signal) {
  return searchMergedFoods(query, page, signal);
}

export async function enrichFood(food) {
  return enrichFoodDetail(food);
}

export function getActiveProvider() {
  if (!isApiConfigured()) return 'USDA + Open Food Facts (add USDA key for more results)';
  return 'USDA + Open Food Facts';
}

export { dedupeFoods };
