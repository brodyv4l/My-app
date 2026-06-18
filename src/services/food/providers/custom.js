import { FOOD_API_CONFIG } from '../../../config/foodApi';
import { createFoodItem } from '../normalize';

function authHeaders() {
  const { apiKey, custom } = FOOD_API_CONFIG;
  if (!apiKey) return {};
  return {
    [custom.apiKeyHeader]: `${custom.apiKeyPrefix}${apiKey}`,
  };
}

function mapCustomItem(item) {
  return createFoodItem({
    id: `custom:${item.id}`,
    name: item.brand ? `${item.name} (${item.brand})` : item.name,
    brand: item.brand || '',
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    serving: item.serving || '1 serving',
    servingGrams: item.servingGrams,
    source: 'custom',
    needsDetail: item.needsDetail ?? false,
    raw: item,
  });
}

function parseSearchResponse(data) {
  const items = Array.isArray(data) ? data : (data.foods || data.results || data.items || []);
  return items.map(mapCustomItem);
}

export async function searchCustom(query, pageSize = 20) {
  const { custom } = FOOD_API_CONFIG;
  if (!custom.searchUrl) throw new Error('Custom search URL not configured');

  const url = new URL(custom.searchUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('query', query);
  url.searchParams.set('limit', String(pageSize));

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Custom API error: ${res.status}`);
  return parseSearchResponse(await res.json());
}

export async function getCustomDetails(food) {
  const { custom } = FOOD_API_CONFIG;
  if (!custom.detailUrl) return food;

  const id = food.raw?.id || food.id.replace('custom:', '');
  const url = custom.detailUrl.endsWith('/')
    ? `${custom.detailUrl}${id}`
    : `${custom.detailUrl}/${id}`;

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return food;
  const data = await res.json();
  return mapCustomItem(data.food || data);
}
