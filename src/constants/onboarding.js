export const GOAL_STRATEGIES = [
  {
    id: 'lean_bulk',
    label: 'Lean Bulk',
    descGain: 'Gradual muscle gain with minimal fat gain',
    descLose: 'Slower, sustainable fat loss while preserving muscle',
  },
  {
    id: 'fast_cut',
    label: 'Fast Cut',
    descGain: 'Faster strength focus with a tighter calorie surplus',
    descLose: 'Aggressive calorie deficit for faster weight loss',
  },
];

export const ONBOARDING_STEPS = {
  METRICS: 'metrics',
  GOAL: 'goal',
  DETAILS: 'details',
  TARGET: 'target',
  REVIEW: 'review',
};

export function getOnboardingFlow(goalType) {
  if (goalType === 'maintain') {
    return [ONBOARDING_STEPS.METRICS, ONBOARDING_STEPS.GOAL, ONBOARDING_STEPS.TARGET, ONBOARDING_STEPS.REVIEW];
  }
  return [
    ONBOARDING_STEPS.METRICS,
    ONBOARDING_STEPS.GOAL,
    ONBOARDING_STEPS.DETAILS,
    ONBOARDING_STEPS.TARGET,
    ONBOARDING_STEPS.REVIEW,
  ];
}

export const INITIAL_SURVEY = {
  heightFeet: '',
  heightInches: '',
  weight: '',
  goalType: '',
  goalStrategy: '',
  targetWeight: '',
  targetDate: null,
};
