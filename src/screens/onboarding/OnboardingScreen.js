import { useEffect } from 'react';
import { View } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useOnboardingSurvey } from '../../hooks/useOnboardingSurvey';
import { ONBOARDING_STEPS } from '../../constants/onboarding';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { Button } from '../../components/ui/Button';
import MetricsStep from '../../components/onboarding/steps/MetricsStep';
import CoreGoalStep from '../../components/onboarding/steps/CoreGoalStep';
import GoalDetailsStep from '../../components/onboarding/steps/GoalDetailsStep';
import TargetTimelineStep from '../../components/onboarding/steps/TargetTimelineStep';
import PlanReviewStep from '../../components/onboarding/steps/PlanReviewStep';

const STEP_COPY = {
  [ONBOARDING_STEPS.METRICS]: {
    title: 'Your metrics',
    subtitle: 'We use this to personalize your nutrition targets.',
  },
  [ONBOARDING_STEPS.GOAL]: {
    title: 'What is your goal?',
    subtitle: 'Choose the outcome you want NutriTrack to optimize for.',
  },
  [ONBOARDING_STEPS.DETAILS]: {
    title: 'How do you want to get there?',
    subtitle: 'Pick the pace that fits your lifestyle.',
  },
  [ONBOARDING_STEPS.TARGET]: {
    title: 'Target & timeline',
    subtitle: 'Set a goal weight and when you want to reach it.',
  },
  [ONBOARDING_STEPS.REVIEW]: {
    title: 'Your personalized plan',
    subtitle: 'Review your targets before getting started.',
  },
};

export default function OnboardingScreen() {
  const { updateProfile } = useUser();
  const {
    survey,
    patchSurvey,
    stepIndex,
    currentStep,
    totalSteps,
    errors,
    plan,
    loading,
    goNext,
    goBack,
    generatePlan,
    completeOnboarding,
    setStepIndex,
    flow,
  } = useOnboardingSurvey(updateProfile);

  useEffect(() => {
    if (stepIndex >= flow.length) {
      setStepIndex(flow.length - 1);
    }
  }, [flow.length, stepIndex, setStepIndex]);

  const copy = STEP_COPY[currentStep];

  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.METRICS:
        return <MetricsStep survey={survey} errors={errors} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.GOAL:
        return <CoreGoalStep survey={survey} errors={errors} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.DETAILS:
        return <GoalDetailsStep survey={survey} errors={errors} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.TARGET:
        return <TargetTimelineStep survey={survey} errors={errors} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.REVIEW:
        return (
          <PlanReviewStep
            survey={survey}
            plan={plan}
            loading={loading}
            onGenerate={generatePlan}
          />
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (currentStep === ONBOARDING_STEPS.REVIEW) {
      if (!plan) return null;
      return <Button title="Get Started" onPress={completeOnboarding} />;
    }
    return <Button title="Continue" onPress={goNext} />;
  };

  return (
    <OnboardingLayout
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      title={copy.title}
      subtitle={copy.subtitle}
      onBack={goBack}
      footer={renderFooter()}
    >
      <View>{renderStep()}</View>
    </OnboardingLayout>
  );
}
