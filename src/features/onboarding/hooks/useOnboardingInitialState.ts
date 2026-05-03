import { useState } from 'react';
import { defaultFormValues } from '#/features/onboarding/types/steps';
import {
  type PersistedState,
  readPersisted,
} from '#/features/onboarding/utils/onboarding-storage';

/**
 * Read persisted onboarding state from sessionStorage exactly once on mount.
 * Used to seed both `useForm`'s defaultValues and the stepper's initial step
 * from the same snapshot so they can't drift apart across a reload.
 */
export function useOnboardingInitialState(): PersistedState {
  const [initial] = useState<PersistedState>(
    () =>
      readPersisted() ?? {
        step: 'INTRO_CAR',
        values: defaultFormValues(),
      },
  );
  return initial;
}
