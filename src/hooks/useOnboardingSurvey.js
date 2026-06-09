import { useState, useMemo, useCallback } from 'react';
import { getOnboardingFlow, INITIAL_SURVEY, ONBOARDING_STEPS } from '../constants/onboarding';
import {
  validateMetrics,
  validateGoal,
  validateGoalDetails,
  validateTarget,
  buildAiSurveyPayload,
  surveyToProfilePayload,
} from '../utils/onboardingValidation';
import { generateCalorieTarget } from '../services/openai';

export function useOnboardingSurvey(updateProfile) {
  const [survey, setSurvey] = useState({ ...INITIAL_SURVEY });
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const flow = useMemo(() => getOnboardingFlow(survey.goalType || ''), [survey.goalType]);
  const currentStep = flow[stepIndex] || ONBOARDING_STEPS.METRICS;
  const totalSteps = flow.length;

  const patchSurvey = useCallback((updates) => {
    setSurvey((prev) => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const validateCurrentStep = useCallback(() => {
    let stepErrors = {};
    switch (currentStep) {
      case ONBOARDING_STEPS.METRICS:
        stepErrors = validateMetrics(survey);
        break;
      case ONBOARDING_STEPS.GOAL:
        stepErrors = validateGoal(survey);
        break;
      case ONBOARDING_STEPS.DETAILS:
        stepErrors = validateGoalDetails(survey);
        break;
      case ONBOARDING_STEPS.TARGET:
        stepErrors = validateTarget({ ...survey, currentWeight: survey.weight });
        break;
      default:
        break;
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, survey]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return false;
    setStepIndex((i) => Math.min(i + 1, flow.length - 1));
    return true;
  }, [validateCurrentStep, flow.length]);

  const goBack = useCallback(() => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    try {
      const aiPayload = buildAiSurveyPayload(survey);
      const result = await generateCalorieTarget(aiPayload);
      setPlan(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [survey]);

  const completeOnboarding = useCallback(async () => {
    if (!plan) return false;
    const payload = surveyToProfilePayload(survey, plan);
    await updateProfile(payload);
    return true;
  }, [survey, plan, updateProfile]);

  return {
    survey,
    patchSurvey,
    stepIndex,
    currentStep,
    totalSteps,
    flow,
    errors,
    plan,
    loading,
    goNext,
    goBack,
    validateCurrentStep,
    generatePlan,
    completeOnboarding,
    setStepIndex,
  };
}
