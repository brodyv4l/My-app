import { FOOD_DATABASE } from '../../../data/foods';
import { createFoodItem } from '../normalize';

export async function searchLocal(query, limit = 20) {
  const q = query.toLowerCase().trim();
  return FOOD_DATABASE
    .filter((f) => f.name.toLowerCase().includes(q))
    .slice(0, limit)
    .map((f) => createFoodItem({
      id: `local:${f.id}`,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      serving: f.serving,
      source: 'local',
    }));
}

