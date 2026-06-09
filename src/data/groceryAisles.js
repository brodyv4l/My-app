export const AISLE_ORDER = ['Produce', 'Meat & Seafood', 'Dairy', 'Grains & Bakery', 'Pantry', 'Frozen', 'Other'];

export const INGREDIENT_AISLE = {
  'chicken breast': 'Meat & Seafood',
  'salmon fillet': 'Meat & Seafood',
  'turkey breast': 'Meat & Seafood',
  'eggs': 'Dairy',
  'greek yogurt': 'Dairy',
  'milk': 'Dairy',
  'cheddar cheese': 'Dairy',
  'mixed berries': 'Produce',
  'banana': 'Produce',
  'apple': 'Produce',
  'spinach': 'Produce',
  'broccoli': 'Produce',
  'avocado': 'Produce',
  'sweet potato': 'Produce',
  'brown rice': 'Grains & Bakery',
  'oatmeal': 'Grains & Bakery',
  'whole wheat bread': 'Grains & Bakery',
  'granola': 'Grains & Bakery',
  'olive oil': 'Pantry',
  'almond butter': 'Pantry',
  'peanut butter': 'Pantry',
  'honey': 'Pantry',
  'protein powder': 'Pantry',
  'almonds': 'Pantry',
  'black beans': 'Pantry',
  'quinoa': 'Pantry',
  'frozen berries': 'Frozen',
};

export function aisleForIngredient(name) {
  const key = String(name).toLowerCase().trim();
  return INGREDIENT_AISLE[key] || 'Other';
}

export function groupByAisle(items) {
  const groups = {};
  items.forEach((item) => {
    const aisle = aisleForIngredient(item);
    if (!groups[aisle]) groups[aisle] = [];
    groups[aisle].push(item);
  });
  return AISLE_ORDER.filter((a) => groups[a]?.length).map((aisle) => ({
    aisle,
    items: [...new Set(groups[aisle])].sort(),
  }));
}
