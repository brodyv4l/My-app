import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '../constants/onboarding';
import { calculateOnboardingPlan, surveyToProfileFromPlan, needsPaceStep } from '../utils/onboardingPlan';
import { useAuth } from '../context/AuthContext';

function draftKey(uid) {
  return `foodprint-${uid}-onboarding-draft`;
}

function isBodyComplete(s) {
  const ageOk = s.age && Number(s.age) > 0;
  const weightOk = s.weight && Number(s.weight) > 0;
  const heightOk = s.heightUnit === 'cm'
    ? s.heightCm && Number(s.heightCm) > 0
    : s.heightFeet !== '' && Number(s.heightFeet) >= 0;
  return ageOk && weightOk && heightOk && s.gender && s.activityLevel;
}

export function useOnboardingSurvey(updateProfile) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [survey, setSurvey] = useState({
    heightFeet: '5',
    heightInches: '8',
    heightCm: '173',
    heightUnit: 'ft',
    weight: '',
    weightUnit: 'lbs',
    age: '',
    gender: '',
    activityLevel: '',
    goalType: '',
    goalPace: 'moderate',
    targetDate: '',
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [plan, setPlan] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (!uid) {
      setDraftLoaded(true);
      return undefined;
    }

    let cancelled = false;
    AsyncStorage.getItem(draftKey(uid))
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const draft = JSON.parse(raw);
          if (draft.survey) setSurvey((prev) => ({ ...prev, ...draft.survey }));
          if (Number.isFinite(draft.stepIndex)) setStepIndex(draft.stepIndex);
          if (draft.plan) setPlan(draft.plan);
        } catch {
          // ignore corrupt draft
        }
      })
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !draftLoaded || stepIndex === 0) return;
    AsyncStorage.setItem(draftKey(uid), JSON.stringify({ survey, stepIndex, plan }));
  }, [uid, draftLoaded, survey, stepIndex, plan]);

  const currentStep = [
    ONBOARDING_STEPS.WELCOME,
    ONBOARDING_STEPS.BODY,
    ONBOARDING_STEPS.GOAL,
    ONBOARDING_STEPS.PACE,
    ONBOARDING_STEPS.PLAN,
  ][stepIndex];

  const patchSurvey = useCallback((updates) => {
    setSurvey((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    if (stepIndex === 0) {
      setStepIndex(1);
      return true;
    }
    if (stepIndex === 1) {
      if (!isBodyComplete(survey)) return false;
      setStepIndex(2);
      return true;
    }
    if (stepIndex === 2) {
      if (!survey.goalType) return false;
      if (needsPaceStep(survey.goalType)) {
        setStepIndex(3);
      } else {
        setPlan(calculateOnboardingPlan(survey));
        setStepIndex(4);
      }
      return true;
    }
    if (stepIndex === 3) {
      if (!survey.goalPace) return false;
      setPlan(calculateOnboardingPlan(survey));
      setStepIndex(4);
      return true;
    }
    return false;
  }, [stepIndex, survey]);

  const goBack = useCallback(() => {
    if (stepIndex === 4) {
      if (needsPaceStep(survey.goalType)) setStepIndex(3);
      else setStepIndex(2);
      setPlan(null);
      return;
    }
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }, [stepIndex, survey.goalType]);

  const completeOnboarding = useCallback(async () => {
    const finalPlan = plan || calculateOnboardingPlan(survey);
    const payload = surveyToProfileFromPlan(survey, finalPlan);
    await updateProfile(payload);
    if (uid) await AsyncStorage.removeItem(draftKey(uid));
    return true;
  }, [survey, plan, updateProfile, uid]);

  const canContinue = () => {
    if (stepIndex === 1) return isBodyComplete(survey);
    if (stepIndex === 2) return !!survey.goalType;
    if (stepIndex === 3) return !!survey.goalPace;
    return true;
  };

  return {
    survey,
    patchSurvey,
    stepIndex,
    currentStep,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    plan,
    setPlan,
    goNext,
    goBack,
    completeOnboarding,
    canContinue,
  };
}
