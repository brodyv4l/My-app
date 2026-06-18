import { createFoodItem } from '../normalize';

function n(v) {
  return Math.round((Number(v) || 0) * 10) / 10;
}

/** Strip non-digits from a scanned UPC/EAN before lookup. */
export function normalizeScannedBarcode(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function parseServingGrams(product) {
  const qty = Number(product.serving_quantity);
  const unitHint = `${product.serving_quantity_unit || ''} ${product.serving_size || ''}`.toLowerCase();

  if (Number.isFinite(qty) && qty > 0) {
    if (unitHint.includes('ml') || unitHint.includes('milliliter')) return qty;
    if (unitHint.includes('oz') || unitHint.includes('ounce')) return qty * 28.3495;
    return qty;
  }

  const ss = String(product.serving_size || '').trim();
  const parenG = ss.match(/\(([\d.]+)\s*g\)/i);
  if (parenG) return Number(parenG[1]);
  const parenMl = ss.match(/\(([\d.]+)\s*ml\)/i);
  if (parenMl) return Number(parenMl[1]);

  const gMatch = ss.match(/([\d.]+)\s*g\b/i);
  if (gMatch) return Number(gMatch[1]);
  const mlMatch = ss.match(/([\d.]+)\s*ml\b/i);
  if (mlMatch) return Number(mlMatch[1]);
  const ozMatch = ss.match(/([\d.]+)\s*oz\b/i);
  if (ozMatch) return Number(ozMatch[1]) * 28.3495;
  return 100;
}

function nutritionScale(product, servingGrams) {
  const per = String(product.nutrition_data_per || '100g').toLowerCase();
  if (per === '100ml' || per === '100 ml') return servingGrams / 100;
  return servingGrams / 100;
}

function kcalFromNutriments(nutriments, suffix) {
  const direct = nutriments[`energy-kcal_${suffix}`];
  if (direct != null && direct !== '' && Number(direct) > 0) return Number(direct);

  const valueKey = suffix === '100g' ? nutriments['energy-kcal_value'] : null;
  if (valueKey != null && valueKey !== '' && Number(valueKey) > 0) return Number(valueKey);

  const plain = nutriments['energy-kcal'];
  if (suffix === '100g' && plain != null && plain !== '' && Number(plain) > 0) return Number(plain);

  const kj = nutriments[`energy_${suffix}`];
  if (kj != null && kj !== '' && Number(kj) > 0) return Number(kj) / 4.184;
  return null;
}

function macroFromNutriments(nutriments, key, suffix) {
  const val = nutriments[`${key}_${suffix}`];
  return val != null && val !== '' ? Number(val) : null;
}

function sodiumMgFromNutriments(nutriments, suffix, multiplier = 1) {
  const sodium = macroFromNutriments(nutriments, 'sodium', suffix);
  if (sodium != null) return sodium * 1000 * multiplier;
  const salt = macroFromNutriments(nutriments, 'salt', suffix);
  if (salt != null) return salt * 1000 * 0.4 * multiplier;
  return null;
}

function mapOffProduct(p) {
  const nutriments = p.nutriments || {};
  const servingGrams = parseServingGrams(p);
  const servingLabel = String(p.serving_size || '').trim() || `${Math.round(servingGrams)}g`;
  const perData = String(p.nutrition_data_per || '').toLowerCase();
  const perServing = perData === 'serving'
    || (kcalFromNutriments(nutriments, 'serving') != null && kcalFromNutriments(nutriments, 'serving') > 0)
    || (macroFromNutriments(nutriments, 'proteins', 'serving') != null
      && macroFromNutriments(nutriments, 'proteins', 'serving') > 0);

  let calories = perServing ? kcalFromNutriments(nutriments, 'serving') : null;
  let protein = perServing ? macroFromNutriments(nutriments, 'proteins', 'serving') : null;
  let carbs = perServing ? macroFromNutriments(nutriments, 'carbohydrates', 'serving') : null;
  let fat = perServing ? macroFromNutriments(nutriments, 'fat', 'serving') : null;
  let fiber = perServing ? macroFromNutriments(nutriments, 'fiber', 'serving') : null;
  let sugar = perServing ? macroFromNutriments(nutriments, 'sugars', 'serving') : null;
  let sodium = perServing ? sodiumMgFromNutriments(nutriments, 'serving') : null;

  const factor = nutritionScale(p, servingGrams);
  const cal100 = kcalFromNutriments(nutriments, '100g');
  if (calories == null || calories <= 0) calories = (cal100 ?? 0) * factor;
  if (protein == null) protein = (macroFromNutriments(nutriments, 'proteins', '100g') ?? 0) * factor;
  if (carbs == null) carbs = (macroFromNutriments(nutriments, 'carbohydrates', '100g') ?? 0) * factor;
  if (fat == null) fat = (macroFromNutriments(nutriments, 'fat', '100g') ?? 0) * factor;
  if (fiber == null) fiber = (macroFromNutriments(nutriments, 'fiber', '100g') ?? 0) * factor;
  if (sugar == null) sugar = (macroFromNutriments(nutriments, 'sugars', '100g') ?? 0) * factor;
  if (sodium == null) sodium = sodiumMgFromNutriments(nutriments, '100g', factor) ?? 0;

  const name = [p.product_name, p.generic_name].find((v) => String(v || '').trim()) || 'Unknown product';

  return createFoodItem({
    id: `off:${p.code || p._id}`,
    name,
    brand: p.brands || '',
    calories: n(calories),
    protein: n(protein),
    carbs: n(carbs),
    fat: n(fat),
    fiber: n(fiber),
    sugar: n(sugar),
    sodium: n(sodium),
    serving: servingLabel,
    servingGrams: Math.round(servingGrams * 10) / 10,
    source: 'brand',
    nutriScore: p.nutriscore_grade?.toUpperCase(),
    raw: p,
  });
}

function barcodeCandidates(barcode) {
  const digits = normalizeScannedBarcode(barcode);
  if (!digits) return [];
  const set = new Set([digits]);
  if (digits.length === 12) set.add(`0${digits}`);
  if (digits.length === 13 && digits.startsWith('0')) set.add(digits.slice(1));
  if (digits.length === 8) {
    set.add(`00000${digits}`);
    set.add(`0000000${digits}`);
  }
  if (digits.length === 13 && digits.startsWith('0000000')) set.add(digits.slice(7));
  return [...set];
}

async function fetchOffProduct(code) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        return { ...data.product, code: data.product.code || code };
      }
    }
  } catch {
    // try v2
  }

  try {
    const fields = [
      'code', 'product_name', 'generic_name', 'brands', 'nutriments',
      'serving_size', 'serving_quantity', 'serving_quantity_unit',
      'nutrition_data_per', 'nutriscore_grade',
    ].join(',');
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}?fields=${fields}`);
    if (res.ok) {
      const data = await res.json();
      if (data.product?.product_name || data.product?.generic_name) {
        return { ...data.product, code: data.product.code || code };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function searchOpenFoodFacts(query, pageSize = 20, page = 1) {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('page', String(page));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Open Food Facts error');
  const data = await res.json();
  return (data.products || []).filter((p) => p.product_name).map(mapOffProduct);
}

export async function getOffProductByBarcode(barcode) {
  for (const code of barcodeCandidates(barcode)) {
    const product = await fetchOffProduct(code);
    if (product) return mapOffProduct(product);
  }
  return null;
}

export { mapOffProduct };
