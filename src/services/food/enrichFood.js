import { FOOD_API_CONFIG } from '../../config/foodApi';
import { getUsdaDetails } from './providers/usda';
import { getNutritionixDetails } from './providers/nutritionix';
import { getEdamamDetails } from './providers/edamam';
import { getCustomDetails } from './providers/custom';

export async function enrichFood(food) {
  if (!food?.needsDetail) return food;
  try {
    if (food.source === 'usda') return await getUsdaDetails(food);
    if (food.source === 'nutritionix') return await getNutritionixDetails(food);
    if (food.source === 'edamam') return await getEdamamDetails(food);
    if (food.source === 'custom') return await getCustomDetails(food);
  } catch (e) {
    console.error('enrichFood', e);
  }
  return food;
}
