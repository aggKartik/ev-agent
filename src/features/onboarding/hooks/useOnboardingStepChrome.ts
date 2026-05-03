import { useMemo } from 'react';
import {
  defaultFormStepNavConfig,
  type FormStep,
  formStepNavConfig,
  formSteps,
  getProgress,
  type OnboardingFormValues,
  type Step,
  steps,
} from '#/features/onboarding/types/steps';

type Args = {
  currentStep: Step;
  formValues: OnboardingFormValues;
  identityReady: boolean;
};

/**
 * Pure projection: step header progress + pinned nav labels from form values
 * and CONNECT readiness. No effects.
 */
export function useOnboardingStepChrome({
  currentStep,
  formValues,
  identityReady,
}: Args) {
  return useMemo(() => {
    const isFormStep = formSteps.includes(currentStep as FormStep);
    const showPinnedFormNav = isFormStep;
    const showProgress = currentStep !== 'SUCCESS';

    const currentFormStepConfig = isFormStep
      ? (formStepNavConfig[currentStep as FormStep] ?? defaultFormStepNavConfig)
      : defaultFormStepNavConfig;

    let canAdvance = isFormStep
      ? currentFormStepConfig.canAdvance(formValues)
      : true;

    if (currentStep === 'CONNECT') {
      canAdvance = identityReady;
    }

    const primaryActionLabel =
      (isFormStep &&
        currentFormStepConfig.getPrimaryActionLabel?.(formValues)) ||
      'Continue';

    const stepIndex = steps.indexOf(currentStep);
    const progressValue = getProgress(currentStep);

    const currentProgressIndex = showProgress
      ? formSteps.indexOf(currentStep as FormStep)
      : -1;

    const progressLabel =
      currentStep === 'SUCCESS'
        ? 'COMPLETE'
        : `STEP ${currentProgressIndex + 1} OF ${formSteps.length}`;

    return {
      showPinnedFormNav,
      showProgress,
      canAdvance,
      primaryActionLabel,
      progressLabel,
      progressValue,
      stepIndex,
    };
  }, [currentStep, formValues, identityReady]);
}
