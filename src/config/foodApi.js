/**
 * Food API configuration
 *
 * Set provider + keys in .env (copy from .env.example)
 * Supported providers: usda | nutritionix | edamam | custom | local
 *
 * Top apps use Nutritionix (~2M+ foods) or Edamam. USDA is free with 400k+ foods.
 */

export const FOOD_API_CONFIG = {
  // Change this when you get an API, or set EXPO_PUBLIC_FOOD_API_PROVIDER in .env
  provider: process.env.EXPO_PUBLIC_FOOD_API_PROVIDER || 'usda',

  apiKey: process.env.EXPO_PUBLIC_USDA_API_KEY || process.env.EXPO_PUBLIC_FOOD_API_KEY || '',
  appId: process.env.EXPO_PUBLIC_FOOD_API_APP_ID || '',

  // Optional proxy for web CORS (your backend forwards requests to the food API)
  proxyUrl: process.env.EXPO_PUBLIC_FOOD_API_PROXY_URL || '',

  // Custom API settings (when provider = 'custom')
  custom: {
    searchUrl: process.env.EXPO_PUBLIC_FOOD_CUSTOM_SEARCH_URL || '',
    detailUrl: process.env.EXPO_PUBLIC_FOOD_CUSTOM_DETAIL_URL || '',
    apiKeyHeader: process.env.EXPO_PUBLIC_FOOD_CUSTOM_KEY_HEADER || 'Authorization',
    apiKeyPrefix: process.env.EXPO_PUBLIC_FOOD_CUSTOM_KEY_PREFIX || 'Bearer ',
  },

  searchDebounceMs: 300,
  minQueryLength: 2,
  pageSize: 20,
};

export function isApiConfigured() {
  const { provider, apiKey, appId, custom } = FOOD_API_CONFIG;
  if (provider === 'local') return false;
  if (provider === 'custom') return Boolean(custom.searchUrl);
  if (provider === 'usda') return Boolean(apiKey);
  if (provider === 'nutritionix') return Boolean(apiKey && appId);
  if (provider === 'edamam') return Boolean(apiKey && appId);
  return false;
}
