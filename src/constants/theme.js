export const colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surface2: '#1C1C1C',
  surface3: '#242424',
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#888888',
  accent: '#AAFF00',
  accentDim: '#88CC00',
  accentMuted: 'rgba(170, 255, 0, 0.12)',
  onAccent: '#0A0A0A',
  protein: '#FCD34D',
  carbs: '#60A5FA',
  fat: '#F472B6',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#67E8F9',
  proGold: '#F59E0B',
  white: '#FFFFFF',
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
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
  'Halal', 'Kosher', 'Keto', 'Mediterranean', 'High Protein',
];

export const MEAL_PLANNER_FILTERS = [
  'No Preference', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'High Protein', 'Keto', 'Mediterranean',
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise', icon: '🛋️' },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week', icon: '🚶' },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week', icon: '🏃' },
  { id: 'active', label: 'Very Active', desc: '6-7 days/week', icon: '💪' },
  { id: 'extreme', label: 'Athlete', desc: '2x/day training', icon: '🏋️' },
];

export const GOAL_TYPES = [
  { id: 'lose', label: 'Lose Weight', desc: 'Calorie deficit for fat loss', icon: '🔥' },
  { id: 'gain', label: 'Build Muscle', desc: 'Lean bulk with high protein', icon: '💪' },
  { id: 'maintain', label: 'Maintain Weight', desc: 'Stay at current weight', icon: '⚖️' },
  { id: 'performance', label: 'Improve Performance', desc: 'Fuel for athletic goals', icon: '🏃' },
  { id: 'healthy', label: 'Eat Healthier', desc: 'Balanced nutrition', icon: '🥗' },
];

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

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const DEFAULT_HABITS = [
  { id: 'log_meals', label: 'Logged all meals', auto: true },
  { id: 'protein', label: 'Hit protein goal', auto: true },
  { id: 'water', label: 'Hit water goal', auto: true },
  { id: 'no_alcohol', label: 'Sober today', auto: false },
  { id: 'fasting_done', label: 'Completed fasting window', auto: false },
  { id: 'exercise', label: 'Exercised today', auto: false },
  { id: 'sleep', label: '7+ hours sleep', auto: false },
  { id: 'no_junk', label: 'No junk food', auto: false },
];

export const STREAK_MILESTONES = [
  { days: 3, message: '3 days! Keep it up 🌱' },
  { days: 7, message: "One week! You're building a habit 💪" },
  { days: 14, message: 'Two weeks strong! 🌿' },
  { days: 30, message: '30 days! Your tree is thriving 🌳' },
  { days: 60, message: '60 days! Incredible consistency 🏆' },
  { days: 100, message: "100 days! You're legendary 👑" },
  { days: 365, message: '365 days. You ARE the forest. 🌳✨' },
];

export function defaultMealByTime() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Breakfast';
  if (hour < 15) return 'Lunch';
  if (hour < 21) return 'Dinner';
  return 'Snacks';
}

export function waterGoalOz(weightLbs) {
  const w = Number(weightLbs) || 154;
  return Math.round(w / 2);
}

export const lightColors = {
  ...colors,
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  surface2: '#EEEEEE',
  surface3: '#E4E4E4',
  border: '#DDDDDD',
  borderLight: '#CCCCCC',
  text: '#0A0A0A',
  textSecondary: '#444444',
  textMuted: '#666666',
  accent: '#3D7A00',
  accentDim: '#2F6200',
  accentMuted: 'rgba(61, 122, 0, 0.14)',
  onAccent: '#FFFFFF',
};

export function getColorsForMode(mode) {
  return mode === 'light' ? lightColors : colors;
}
