/** Parse one ingredient entry from strings or AI meal objects. */
export function parseIngredient(ing) {
  if (!ing) return { item: '', amount: '' };
  if (typeof ing === 'string') {
    const trimmed = ing.trim();
    const match = trimmed.match(/^([\d./]+\s*(?:cups?|tbsp|tsp|oz|lbs?|lb|g|ml|cloves?|slices?|servings?)?)\s+(.+)$/i);
    if (match) return { amount: match[1].trim(), item: match[2].trim() };
    return { item: trimmed, amount: '' };
  }
  const item = String(ing.item || ing.name || '').trim();
  const amount = String(ing.amount || ing.quantity || '').trim();
  return { item, amount };
}

/** Display string for meal cards and lists. */
export function formatIngredient(ing) {
  const { item, amount } = parseIngredient(ing);
  if (!item) return '';
  return amount ? `${amount} ${item}` : item;
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function itemKey(item) {
  return item.toLowerCase().replace(/\s+/g, ' ').trim();
}

const CATEGORY_RULES = [
  {
    key: 'produce',
    words: ['apple', 'banana', 'berr', 'broccoli', 'spinach', 'avocado', 'tomato', 'lettuce',
      'pepper', 'onion', 'garlic', 'carrot', 'celery', 'potato', 'asparagus', 'corn', 'slaw',
      'vegetable', 'fruit', 'lemon', 'lime', 'zucchini', 'cucumber', 'salad', 'green', 'mango'],
  },
  {
    key: 'proteins',
    words: ['chicken', 'turkey', 'beef', 'salmon', 'cod', 'shrimp', 'tuna', 'fish', 'egg',
      'pork', 'tofu', 'chickpea', 'bean', 'meatball', 'meat', 'protein powder'],
  },
  {
    key: 'dairy',
    words: ['yogurt', 'milk', 'cheese', 'cottage', 'butter', 'cream', 'feta'],
  },
  {
    key: 'grains',
    words: ['rice', 'bread', 'toast', 'oat', 'pasta', 'tortilla', 'quinoa', 'granola',
      'noodle', 'zoodle', 'wrap', 'sourdough', 'wheat'],
  },
  {
    key: 'pantry',
    words: ['oil', 'sauce', 'honey', 'almond', 'peanut', 'nut', 'hummus', 'salsa', 'marinara',
      'soy', 'vinegar', 'trail', 'dried', 'powder', 'spice', 'mustard', 'mayo'],
  },
];

export function categorizeIngredient(itemName) {
  const lower = itemName.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => lower.includes(w))) return rule.key;
  }
  return 'other';
}

function formatMergedQuantity(amounts, count) {
  const unique = [...new Set(amounts.filter(Boolean))];
  if (unique.length === 1 && count > 1) return `${unique[0]} × ${count}`;
  if (unique.length === 1) return unique[0];
  if (unique.length > 1) return unique.join(' + ');
  if (count > 1) return `${count}× needed this week`;
  return '';
}

export function mergeParsedIngredients(entries) {
  const map = new Map();
  entries.forEach(({ item, amount }) => {
    if (!item) return;
    const key = itemKey(item);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { item: titleCase(item), amounts: amount ? [amount] : [], count: 1 });
      return;
    }
    existing.count += 1;
    if (amount && !existing.amounts.includes(amount)) existing.amounts.push(amount);
  });
  return [...map.values()].map(({ item, amounts, count }) => ({
    item,
    quantity: formatMergedQuantity(amounts, count),
  }));
}

/** Collect every ingredient from the full 7-day plan (correct weekly quantities). */
export function collectPlanIngredients(plan) {
  const parsed = [];

  (plan?.days || []).forEach((day) => {
    const meals = day?.meals;
    if (!meals) return;
    const mealList = Array.isArray(meals) ? meals : Object.values(meals);
    mealList.forEach((meal) => {
      (meal?.ingredients || []).forEach((ing) => {
        const p = parseIngredient(ing);
        if (p.item) parsed.push(p);
      });
    });
  });

  if (parsed.length) return parsed;

  const pool = plan?.pool;
  if (pool) {
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach((type) => {
      (pool[type] || []).forEach((meal) => {
        (meal?.ingredients || []).forEach((ing) => {
          const p = parseIngredient(ing);
          if (p.item) parsed.push(p);
        });
      });
    });
  }

  return parsed;
}

/** Build categorized grocery groups from a meal plan. */
export function buildGroceryGroupsFromPlan(plan) {
  const merged = mergeParsedIngredients(collectPlanIngredients(plan));
  const groups = {
    produce: [],
    proteins: [],
    dairy: [],
    grains: [],
    pantry: [],
    other: [],
  };

  merged.forEach((row) => {
    const cat = categorizeIngredient(row.item);
    groups[cat].push(row);
  });

  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => a.item.localeCompare(b.item));
  });

  return groups;
}
