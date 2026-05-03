import { useEffect } from 'react';
import type {
  OnboardingFormValues,
  Step,
} from '#/features/onboarding/types/steps';
import {
  clearPersisted,
  writePersisted,
} from '#/features/onboarding/utils/onboarding-storage';

type FormLike = {
  state: { values: OnboardingFormValues };
  store: {
    subscribe: (listener: (value: unknown) => void) => {
      unsubscribe: () => void;
    };
  };
};

/**
 * Persists the onboarding form values + current step to sessionStorage on
 * every change. Clears storage once the user reaches SUCCESS so a fresh run
 * starts clean. Subscribes to `form.store` directly to avoid re-rendering the
 * component on every keystroke just to write to storage.
 */
export function useOnboardingPersist(form: FormLike, currentStep: Step): void {
  useEffect(() => {
    if (currentStep === 'SUCCESS') {
      clearPersisted();
      return;
    }

    const snapshot = () =>
      writePersisted({ step: currentStep, values: form.state.values });

    snapshot();
    const sub = form.store.subscribe(snapshot);
    return () => sub.unsubscribe();
  }, [form, currentStep]);
}
