export const colors = {
  bg: '#09090b',
  surface: '#111114',
  surface2: '#18181b',
  surface3: '#1f1f23',
  border: '#27272a',
  borderLight: '#3f3f46',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  accent: '#a3e635',
  accentDim: '#84cc16',
  accentMuted: 'rgba(163, 230, 53, 0.12)',
  protein: '#93c5fd',
  carbs: '#fcd34d',
  fat: '#f9a8d4',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#67e8f9',
  white: '#ffffff',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase' },
};

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Halal', 'Kosher', 'Low-Carb', 'High-Protein',
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
  { id: 'active', label: 'Very Active', desc: '6-7 days/week' },
  { id: 'extreme', label: 'Extremely Active', desc: 'Athlete / physical job' },
];

export const GOAL_TYPES = [
  { id: 'lose', label: 'Lose Weight', desc: 'Calorie deficit for fat loss' },
  { id: 'maintain', label: 'Eat Healthy', desc: 'Balanced nutrition & wellness' },
  { id: 'gain', label: 'Build Muscle', desc: 'Lean bulk with high protein' },
];

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const RESTAURANTS = [
  { id: 'mcdonalds', name: "McDonald's" },
  { id: 'chipotle', name: 'Chipotle' },
  { id: 'subway', name: 'Subway' },
  { id: 'starbucks', name: 'Starbucks' },
  { id: 'tacobell', name: 'Taco Bell' },
  { id: 'wendys', name: "Wendy's" },
  { id: 'chickfila', name: 'Chick-fil-A' },
  { id: 'dominos', name: "Domino's" },
  { id: 'panera', name: 'Panera' },
  { id: 'olivegarden', name: 'Olive Garden' },
];

export function defaultMealByTime() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Breakfast';
  if (hour < 15) return 'Lunch';
  if (hour < 21) return 'Dinner';
  return 'Snacks';
}
