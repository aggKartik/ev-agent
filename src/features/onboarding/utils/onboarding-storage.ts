import {
  defaultFormValues,
  isStep,
  type OnboardingFormValues,
  type Step,
} from '#/features/onboarding/types/steps';

const STORAGE_KEY = 'ev-agent:onboarding:v3';
const LEGACY_STORAGE_KEY = 'ev-agent:onboarding:v2';
const PERSISTED_VERSION = 3;

/** Map removed funnel steps onto the Tesla-only onboarding flow. */
const LEGACY_STEP_MAP: Record<string, Step> = {
  INTRO_CAR: 'NAME',
  MAKE: 'NAME',
  MODEL: 'NAME',
  YEAR: 'NAME',
  CONNECT: 'CONNECT',
  NAME: 'NAME',
  SUCCESS: 'SUCCESS',
};

function coerceStoredStep(raw: unknown): Step {
  if (typeof raw !== 'string') return 'NAME';
  if (isStep(raw)) return raw;
  return LEGACY_STEP_MAP[raw] ?? 'NAME';
}

export type PersistedState = {
  step: Step;
  values: OnboardingFormValues;
};

export function readPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null;

  try {
    const keys = [STORAGE_KEY, LEGACY_STORAGE_KEY];
    for (const storageKey of keys) {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        currentStep?: unknown;
        values?: Partial<
          OnboardingFormValues & {
            make?: unknown;
            model?: unknown;
            year?: unknown;
          }
        >;
      };
      const step = coerceStoredStep(parsed.currentStep);
      const valuesRaw = parsed.values ?? {};
      return {
        step,
        values: {
          ...defaultFormValues(),
          name: typeof valuesRaw.name === 'string' ? valuesRaw.name : '',
          connect:
            typeof valuesRaw.connect === 'string' ? valuesRaw.connect : '',
        },
      };
    }
    return null;
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
        version: PERSISTED_VERSION,
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
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
