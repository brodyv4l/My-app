import {
  buildGroceryGroupsFromPlan,
  mergeParsedIngredients,
  parseIngredient,
} from '../utils/mealIngredients';

const MODEL = 'claude-haiku-4-5-20251001';

export async function generateGroceryList(ingredientsList, mealPlan = null) {
  if (mealPlan?.days?.length) {
    return buildGroceryGroupsFromPlan(mealPlan);
  }

  const parsed = (ingredientsList || []).map((ing) => parseIngredient(ing)).filter((p) => p.item);
  if (!parsed.length) {
    return buildGroceryGroupsFromPlan({ days: [] });
  }

  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) {
    return buildGroceryGroupsFromPlan({ days: [{ meals: { x: { ingredients: parsed } } }] });
  }

  const ingredientLines = mergeParsedIngredients(parsed)
    .map((row) => (row.quantity ? `${row.item} (${row.quantity})` : row.item))
    .join('\n');

  const prompt = `Organize this EXACT grocery list for one week. Do not add or remove items.

${ingredientLines}

Rules:
1. Keep every item above — same names, adjusted quantities only if merging duplicates
2. Sort into categories: produce, proteins, dairy, grains, pantry, other
3. No item in more than one category

Return ONLY raw JSON:
{
  "produce": [{"item":"Bananas","quantity":"2"}],
  "proteins": [],
  "dairy": [],
  "grains": [],
  "pantry": [],
  "other": []
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error('AI grocery failed');
    const data = await response.json();
    const text = (data.content?.[0]?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const grouped = JSON.parse(text);
    return sanitizeGroceryGroups(grouped, parsed);
  } catch (e) {
    console.error('groceryGenerator', e);
    return buildGroceryGroupsFromPlan({ days: [{ meals: { x: { ingredients: parsed } } }] });
  }
}

function sanitizeGroceryGroups(grouped, sourceParsed) {
  const sourceNames = new Set(sourceParsed.map((p) => p.item.toLowerCase()));
  const out = {
    produce: [],
    proteins: [],
    dairy: [],
    grains: [],
    pantry: [],
    other: [],
  };

  ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'other'].forEach((key) => {
    (grouped[key] || []).forEach((row) => {
      const item = typeof row === 'string' ? row : row?.item;
      if (!item || !sourceNames.has(String(item).toLowerCase())) return;
      out[key].push(typeof row === 'string' ? { item: row, quantity: '' } : row);
    });
  });

  const placed = new Set(
    Object.values(out).flat().map((r) => String(r.item).toLowerCase()),
  );
  const missing = sourceParsed.filter((p) => !placed.has(p.item.toLowerCase()));
  if (missing.length) {
    const fallback = buildGroceryGroupsFromPlan({
      days: [{ meals: { x: { ingredients: missing } } }],
    });
    Object.keys(out).forEach((key) => {
      out[key] = [...out[key], ...(fallback[key] || [])];
    });
  }

  Object.keys(out).forEach((key) => {
    out[key].sort((a, b) => a.item.localeCompare(b.item));
  });

  return out;
}

export const GROCERY_CATEGORIES = [
  { key: 'produce', label: '🥬 Produce' },
  { key: 'proteins', label: '🍗 Proteins' },
  { key: 'dairy', label: '🥛 Dairy & Eggs' },
  { key: 'grains', label: '🌾 Grains & Carbs' },
  { key: 'pantry', label: '🫙 Pantry & Sauces' },
  { key: 'other', label: '📦 Other' },
];
