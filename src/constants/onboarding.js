export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  BODY: 'body',
  GOAL: 'goal',
  PACE: 'pace',
  PLAN: 'plan',
};

export const ONBOARDING_FLOW = [
  ONBOARDING_STEPS.WELCOME,
  ONBOARDING_STEPS.BODY,
  ONBOARDING_STEPS.GOAL,
  ONBOARDING_STEPS.PACE,
  ONBOARDING_STEPS.PLAN,
];

export const TOTAL_ONBOARDING_STEPS = 5;

export const ONBOARDING_GOALS = [
  { id: 'lose', icon: '🔥', label: 'Lose Weight', desc: 'Burn fat with a calorie deficit' },
  { id: 'gain', icon: '💪', label: 'Build Muscle', desc: 'Gain lean mass with a calorie surplus' },
  { id: 'maintain', icon: '⚖️', label: 'Maintain Weight', desc: 'Stay at your current weight' },
  { id: 'performance', icon: '🏃', label: 'Improve Performance', desc: 'Fuel better for training and endurance' },
  { id: 'healthy', icon: '🥗', label: 'Eat Healthier', desc: 'Better nutrition without a specific weight goal' },
];

export const LOSE_PACE_OPTIONS = [
  { id: 'slow', icon: '🐢', label: 'Slow', rate: '−0.5 lb per week', desc: 'Easiest to stick to' },
  { id: 'moderate', icon: '🏃', label: 'Moderate', rate: '−1 lb per week', desc: 'Balanced approach', recommended: true },
  { id: 'aggressive', icon: '🔥', label: 'Aggressive', rate: '−1.5 lb per week', desc: 'Requires strict discipline' },
];

export const GAIN_PACE_OPTIONS = [
  { id: 'lean', icon: '🎯', label: 'Lean Bulk', rate: '+0.25 lb per week', desc: 'Minimal fat gain' },
  { id: 'standard', icon: '💪', label: 'Standard Bulk', rate: '+0.5 lb per week', desc: 'Best muscle to fat ratio', recommended: true },
  { id: 'aggressive', icon: '🚀', label: 'Aggressive Bulk', rate: '+1 lb per week', desc: 'Maximum muscle gain' },
];

export const PACE_LBS_PER_WEEK = {
  lose: { slow: 0.5, moderate: 1, aggressive: 1.5 },
  gain: { lean: 0.25, standard: 0.5, aggressive: 1 },
};

export const INITIAL_SURVEY = {
  heightFeet: '',
  heightInches: '',
  heightCm: '',
  heightUnit: 'ft',
  weight: '',
  weightUnit: 'lbs',
  age: '',
  gender: '',
  activityLevel: '',
  goalType: '',
  goalPace: 'moderate',
  targetDate: '',
};
