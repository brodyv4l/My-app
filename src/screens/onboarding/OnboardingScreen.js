import { View } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useOnboardingSurvey } from '../../hooks/useOnboardingSurvey';
import { ONBOARDING_STEPS } from '../../constants/onboarding';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { Button } from '../../components/ui/Button';
import WelcomeStep from '../../components/onboarding/steps/WelcomeStep';
import BodyStatsStep from '../../components/onboarding/steps/BodyStatsStep';
import GoalStep from '../../components/onboarding/steps/GoalStep';
import PaceStep from '../../components/onboarding/steps/PaceStep';
import PlanStep from '../../components/onboarding/steps/PlanStep';

const STEP_COPY = {
  [ONBOARDING_STEPS.BODY]: { title: 'Tell us about yourself', subtitle: 'We use this to calculate your exact targets' },
  [ONBOARDING_STEPS.GOAL]: { title: "What's your main goal?", subtitle: 'This shapes your entire nutrition plan' },
};

export default function OnboardingScreen() {
  const { updateProfile } = useUser();
  const {
    survey, patchSurvey, stepIndex, currentStep, totalSteps,
    plan, setPlan, goNext, goBack, completeOnboarding, canContinue,
  } = useOnboardingSurvey(updateProfile);

  const copy = STEP_COPY[currentStep] || {};

  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME: return <WelcomeStep />;
      case ONBOARDING_STEPS.BODY: return <BodyStatsStep survey={survey} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.GOAL: return <GoalStep survey={survey} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.PACE: return <PaceStep survey={survey} onChange={patchSurvey} />;
      case ONBOARDING_STEPS.PLAN:
        return <PlanStep survey={survey} plan={plan} onPlanReady={setPlan} />;
      default: return null;
    }
  };

  const renderFooter = () => {
    if (currentStep === ONBOARDING_STEPS.WELCOME) {
      return <Button title="Get Started →" onPress={goNext} />;
    }
    if (currentStep === ONBOARDING_STEPS.PLAN) {
      return <Button title="Let's Go! 🚀" onPress={completeOnboarding} />;
    }
    return (
      <Button
        title="Continue →"
        onPress={goNext}
        disabled={!canContinue()}
      />
    );
  };

  const isWelcome = currentStep === ONBOARDING_STEPS.WELCOME;
  const isPlan = currentStep === ONBOARDING_STEPS.PLAN;
  const isPace = currentStep === ONBOARDING_STEPS.PACE;

  return (
    <OnboardingLayout
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      title={isWelcome || isPlan ? undefined : (isPace ? undefined : copy.title)}
      subtitle={isWelcome || isPlan ? undefined : (isPace ? undefined : copy.subtitle)}
      onBack={goBack}
      footer={renderFooter()}
      hideHeader={isWelcome}
      showDots
    >
      <View style={{ flex: 1 }}>{renderStep()}</View>
    </OnboardingLayout>
  );
}
