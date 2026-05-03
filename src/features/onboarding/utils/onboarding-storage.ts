import {
  defaultFormValues,
  isStep,
  type OnboardingFormValues,
  type Step,
} from '#/features/onboarding/types/steps';

const STORAGE_KEY = 'ev-agent:onboarding:v1';

export type PersistedState = {
  step: Step;
  values: OnboardingFormValues;
};

export function readPersisted(): PersistedState | null {
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

export function writePersisted(state: PersistedState): void {
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

export function clearPersisted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
