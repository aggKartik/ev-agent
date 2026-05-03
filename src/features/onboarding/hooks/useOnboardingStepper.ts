import { useCallback, useState } from 'react';
import {
  getNextStep,
  getPreviousStep,
  type Step,
} from '#/features/onboarding/types/steps';

export type Stepper = {
  currentStep: Step;
  direction: 'forward' | 'back';
  transitionKey: number;
  goNext: () => void;
  goPrev: () => void;
  goTo: (step: Step, direction?: 'forward' | 'back') => void;
};

/**
 * Owns the current step plus the transition metadata that drives the step
 * animation (direction + a key that force-remounts the stage).
 */
export function useOnboardingStepper(initialStep: Step): Stepper {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [transitionKey, setTransitionKey] = useState(0);

  const goNext = useCallback(() => {
    setDirection('forward');
    setCurrentStep((s) => getNextStep(s));
    setTransitionKey((v) => v + 1);
  }, []);

  const goPrev = useCallback(() => {
    setDirection('back');
    setCurrentStep((s) => getPreviousStep(s));
    setTransitionKey((v) => v + 1);
  }, []);

  const goTo = useCallback<Stepper['goTo']>((step, dir = 'forward') => {
    setDirection(dir);
    setCurrentStep(step);
    setTransitionKey((v) => v + 1);
  }, []);

  return { currentStep, direction, transitionKey, goNext, goPrev, goTo };
}
