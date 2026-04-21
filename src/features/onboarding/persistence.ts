import { useEffect, useState } from 'react';
import {
  defaultFormValues,
  isStep,
  type OnboardingFormValues,
  type Step,
} from './steps';

/**
 * Session-scoped persistence for the onboarding flow. Survives a full-page
 * OAuth redirect so the user returns to the step they left from, with their
 * answers intact.
 */

const STORAGE_KEY = 'ev-agent:onboarding:v1';

type PersistedState = {
  step: Step;
  values: OnboardingFormValues;
};

function readPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      currentStep?: unknown;
      values?: Partial<OnboardingFormValues>;
    };
    if (!isStep(parsed.currentStep)) return null;
    const prefs = parsed.values?.prefs;
    return {
      step: parsed.currentStep,
      values: {
        ...defaultFormValues(),
        ...parsed.values,
        prefs: Array.isArray(prefs) ? prefs : [],
      },
    };
  } catch {
    return null;
  }
}

function writePersisted(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        currentStep: state.step,
        values: state.values,
      }),
    );
  } catch {
    // quota exceeded / private mode — not fatal
  }
}

function clearPersisted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

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
