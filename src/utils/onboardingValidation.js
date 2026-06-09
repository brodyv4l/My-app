import { addDays, startOfDay, isAfter, isValid, parseISO } from 'date-fns';

export function validateMetrics({ heightFeet, heightInches, weight }) {
  const errors = {};
  const feet = Number(heightFeet);
  const inches = Number(heightInches);
  const lbs = Number(weight);

  if (heightFeet === '' || Number.isNaN(feet) || feet < 3 || feet > 8) {
    errors.heightFeet = 'Enter a valid height (3–8 ft)';
  }
  if (heightInches === '' || Number.isNaN(inches) || inches < 0 || inches > 11) {
    errors.heightInches = 'Enter inches (0–11)';
  }
  if (!weight || Number.isNaN(lbs) || lbs < 50 || lbs > 700) {
    errors.weight = 'Enter a valid weight (50–700 lbs)';
  }
  return errors;
}

export function validateGoal({ goalType }) {
  const errors = {};
  if (!goalType) errors.goalType = 'Select your primary goal';
  return errors;
}

export function validateGoalDetails({ goalType, goalStrategy }) {
  const errors = {};
  if (goalType !== 'maintain' && !goalStrategy) {
    errors.goalStrategy = 'Select an approach';
  }
  return errors;
}

export function validateTarget({ targetWeight, targetDate, currentWeight }) {
  const errors = {};
  const target = Number(targetWeight);
  const current = Number(currentWeight);

  if (!targetWeight || Number.isNaN(target) || target < 50 || target > 700) {
    errors.targetWeight = 'Enter a valid target weight (50–700 lbs)';
  }

  if (!targetDate || !isValid(targetDate)) {
    errors.targetDate = 'Select a target date';
  } else {
    const today = startOfDay(new Date());
    const selected = startOfDay(targetDate);
    if (!isAfter(selected, today)) {
      errors.targetDate = 'Target date must be in the future';
    }
  }

  if (!errors.targetWeight && !errors.targetDate && goalDiffIsTiny(current, target)) {
    errors.targetWeight = 'Target weight should differ from your current weight';
  }

  return errors;
}

function goalDiffIsTiny(current, target) {
  if (!current || !target) return false;
  return Math.abs(current - target) < 1;
}

export function minTargetDate() {
  return addDays(startOfDay(new Date()), 1);
}

export function formatSurveyDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function surveyToProfilePayload(survey, plan) {
  return {
    heightFeet: Number(survey.heightFeet),
    heightInches: Number(survey.heightInches),
    weight: Number(survey.weight),
    goalType: survey.goalType,
    goalStrategy: survey.goalType === 'maintain' ? null : survey.goalStrategy,
    targetWeight: Number(survey.targetWeight),
    targetDate: survey.targetDate instanceof Date
      ? survey.targetDate.toISOString().slice(0, 10)
      : survey.targetDate,
    surveyCompletedAt: new Date().toISOString(),
    calorieGoal: plan?.calories,
    macroGoals: plan ? { protein: plan.protein, carbs: plan.carbs, fat: plan.fat } : undefined,
    aiExplanation: plan?.explanation || '',
    onboardingComplete: true,
  };
}

export function buildAiSurveyPayload(survey) {
  return {
    heightFeet: Number(survey.heightFeet),
    heightInches: Number(survey.heightInches),
    weightLbs: Number(survey.weight),
    goalType: survey.goalType,
    goalStrategy: survey.goalStrategy || null,
    targetWeightLbs: Number(survey.targetWeight),
    targetDate: survey.targetDate instanceof Date
      ? survey.targetDate.toISOString().slice(0, 10)
      : survey.targetDate,
  };
}
