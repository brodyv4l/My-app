export function isSurveyComplete(profile) {
  if (!profile) return false;
  if (profile.onboardingComplete) return true;
  if (profile.surveyCompletedAt) return true;
  return !!(profile.goalType && profile.age && Number(profile.calorieGoal) > 0);
}

const SURVEY_FIELDS = [
  'onboardingComplete',
  'surveyCompletedAt',
  'age',
  'heightFeet',
  'heightInches',
  'weight',
  'gender',
  'activityLevel',
  'goalType',
  'goalStrategy',
  'goalPace',
  'targetDate',
  'targetWeight',
  'calorieGoal',
  'macroGoals',
  'waterGoalOz',
  'aiExplanation',
  'unitPrefs',
];

/** Keep local onboarding answers when cloud profile is still the empty starter row. */
export function preferLocalSurveyMerge(local, remote) {
  if (!local || !remote) return {};
  if (!isSurveyComplete(local)) return {};

  const merged = {};
  if (!isSurveyComplete(remote)) {
    SURVEY_FIELDS.forEach((key) => {
      if (local[key] !== undefined && local[key] !== null && local[key] !== '') {
        merged[key] = local[key];
      }
    });
  }
  merged.onboardingComplete = true;
  if (local.surveyCompletedAt) {
    merged.surveyCompletedAt = local.surveyCompletedAt;
  }
  return merged;
}

/** Keep local Stripe subscription when cloud sync hasn't caught up yet (post-checkout race). */
export function preferLocalSubscriptionMerge(local, remote) {  if (!local || !remote) return {};

  const localActive = !!(
    local.stripeSubscriptionId
    || local.subscriptionStatus === 'pro'
    || (local.subscriptionStatus === 'trial' && local.trialEndDate)
  );
  const remoteActive = !!(
    remote.stripeSubscriptionId
    || remote.subscriptionStatus === 'pro'
    || (remote.subscriptionStatus === 'trial' && remote.trialEndDate)
  );

  if (!localActive || remoteActive) return {};

  return {
    subscriptionStatus: local.subscriptionStatus,
    subscriptionPlan: local.subscriptionPlan,
    trialStartDate: local.trialStartDate,
    trialEndDate: local.trialEndDate,
    subscriptionStartDate: local.subscriptionStartDate,
    subscriptionEndDate: local.subscriptionEndDate,
    stripeSubscriptionId: local.stripeSubscriptionId,
    stripeCustomerId: local.stripeCustomerId,
    subscriptionCancelAtPeriodEnd: local.subscriptionCancelAtPeriodEnd,
  };
}
