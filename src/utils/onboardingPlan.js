import { lbsToKg, heightToCm } from './units';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extreme: 1.9,
};

const CALORIE_ADJUSTMENTS = {
  lose: { slow: -250, moderate: -500, aggressive: -750 },
  gain: { lean: 200, standard: 350, aggressive: 500 },
};

const MACRO_SPLITS = {
  lose: { carbs: 0.55, fat: 0.45 },
  gain: { carbs: 0.65, fat: 0.35 },
  maintain: { carbs: 0.60, fat: 0.40 },
  performance: { carbs: 0.70, fat: 0.30 },
  healthy: { carbs: 0.55, fat: 0.45 },
};

const PROTEIN_PER_LB = {
  lose: 1.0,
  gain: 1.0,
  maintain: 0.8,
  performance: 0.9,
  healthy: 0.8,
};

function proteinMultiplierForGoal(goal, pace) {
  let mult = PROTEIN_PER_LB[goal] || 0.8;
  if (goal === 'lose' && pace === 'aggressive') mult = 1.2;
  else if (goal === 'lose' && pace === 'slow') mult = 0.9;
  else if (goal === 'gain' && pace === 'aggressive') mult = 1.1;
  else if (goal === 'gain' && pace === 'lean') mult = 1.0;
  return mult;
}

export function calculateMacroGoals(calories, goal, pace, weightLbs) {
  const protein = Math.round(weightLbs * 1.2);
  const proteinCalories = protein * 4;
  const remainingCalories = Math.max(0, calories - proteinCalories);
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.maintain;
  const carbs = Math.round((remainingCalories * split.carbs) / 4);
  const fat = Math.round((remainingCalories * split.fat) / 9);
  return { protein, carbs, fat };
}

const PACE_LBS_PER_WEEK = {
  lose: { slow: 0.5, moderate: 1, aggressive: 1.5 },
  gain: { lean: 0.25, standard: 0.5, aggressive: 1 },
};

const GOAL_LABELS = {
  lose: 'lose weight sustainably',
  gain: 'build lean muscle',
  maintain: 'maintain your current weight',
  performance: 'fuel your training',
  healthy: 'eat healthier every day',
};

const PACE_LABELS = {
  slow: 'a slow, steady pace',
  moderate: 'a moderate pace',
  aggressive: 'an aggressive pace',
  lean: 'a lean bulk approach',
  standard: 'a standard bulk',
};

function getWeightKg(survey) {
  const w = Number(survey.weight);
  return survey.weightUnit === 'kg' ? w : lbsToKg(w);
}

function getHeightCm(survey) {
  if (survey.heightUnit === 'cm') return Number(survey.heightCm) || 0;
  return heightToCm(survey.heightFeet || 0, survey.heightInches || 0);
}

function getWeightLbs(survey) {
  const w = Number(survey.weight);
  return survey.weightUnit === 'kg' ? Math.round(w * 2.20462) : w;
}

export function calculateOnboardingPlan(survey) {
  const age = Number(survey.age) || 30;
  const weightKg = getWeightKg(survey);
  const heightCm = getHeightCm(survey);
  const weightLbs = getWeightLbs(survey);

  let bmrMale = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  let bmrFemale = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  let bmr;
  if (survey.gender === 'male') bmr = bmrMale;
  else if (survey.gender === 'female') bmr = bmrFemale;
  else bmr = (bmrMale + bmrFemale) / 2;

  const multiplier = ACTIVITY_MULTIPLIERS[survey.activityLevel] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  const goal = survey.goalType || 'maintain';
  const pace = survey.goalPace || defaultPace(goal);

  if (goal === 'lose' || goal === 'gain') {
    const adj = CALORIE_ADJUSTMENTS[goal][pace] || 0;
    tdee += adj;
  }

  const calories = Math.max(1200, tdee);

  const { protein, carbs, fat } = calculateMacroGoals(calories, goal, pace, weightLbs);
  const waterGoalOz = Math.round(weightLbs / 2);

  const paceLabel = PACE_LABELS[pace] || 'your selected approach';
  const goalLabel = GOAL_LABELS[goal] || 'reach your goals';

  let weeksEstimate = null;
  if ((goal === 'lose' || goal === 'gain') && survey.targetWeight) {
    const diff = Math.abs(weightLbs - Number(survey.targetWeight));
    const perWeek = PACE_LBS_PER_WEEK[goal]?.[pace] || 1;
    if (perWeek > 0) weeksEstimate = Math.ceil(diff / perWeek);
  }

  const explanation = `Based on your stats, you should eat ${calories.toLocaleString()} calories/day to ${goalLabel}. With ${paceLabel}, you'll see real results in the first 2-3 weeks.`;

  return {
    calories,
    protein,
    carbs,
    fat,
    waterGoalOz,
    explanation,
    weeksEstimate,
    bmr: Math.round(bmr),
    tdee: Math.round(bmr * multiplier),
  };
}

function defaultPace(goal) {
  if (goal === 'lose') return 'moderate';
  if (goal === 'gain') return 'standard';
  return null;
}

export function surveyToProfileFromPlan(survey, plan) {
  const weightLbs = getWeightLbs(survey);
  let heightFeet = survey.heightFeet;
  let heightInches = survey.heightInches;
  if (survey.heightUnit === 'cm') {
    const totalIn = (Number(survey.heightCm) || 170) / 2.54;
    heightFeet = Math.floor(totalIn / 12);
    heightInches = Math.round(totalIn % 12);
  }

  return {
    age: Number(survey.age),
    heightFeet,
    heightInches,
    weight: weightLbs,
    gender: survey.gender,
    activityLevel: survey.activityLevel,
    goalType: survey.goalType,
    goalStrategy: survey.goalPace || '',
    goalPace: survey.goalPace || '',
    targetDate: survey.targetDate || '',
    calorieGoal: plan.calories,
    macroGoals: { protein: plan.protein, carbs: plan.carbs, fat: plan.fat },
    waterGoalOz: plan.waterGoalOz,
    aiExplanation: plan.explanation,
    onboardingComplete: true,
    surveyCompletedAt: new Date().toISOString(),
    subscriptionStatus: 'free',
    unitPrefs: {
      weight: survey.weightUnit || 'lbs',
      height: survey.heightUnit === 'cm' ? 'cm' : 'ft',
      measurements: 'in',
      water: 'oz',
    },
  };
}

export function needsPaceStep(goalType) {
  return goalType === 'lose' || goalType === 'gain';
}
