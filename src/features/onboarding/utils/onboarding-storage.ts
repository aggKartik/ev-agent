import {
  defaultFormValues,
  isStep,
  type OnboardingFormValues,
  type Step,
} from '#/features/onboarding/types/steps';

const STORAGE_KEY = 'ev-agent:onboarding:v4';
const STORAGE_KEY_V3 = 'ev-agent:onboarding:v3';
const LEGACY_STORAGE_KEY = 'ev-agent:onboarding:v2';
const PERSISTED_VERSION = 4;

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

type RawPersisted = {
  currentStep?: unknown;
  values?: Partial<
    OnboardingFormValues & {
      make?: unknown;
      model?: unknown;
      year?: unknown;
    }
  >;
};

const STORAGE_KEYS_TO_TRY = [
  STORAGE_KEY,
  STORAGE_KEY_V3,
  LEGACY_STORAGE_KEY,
] as const;

function readFirstStoredEntry(): RawPersisted | null {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as RawPersisted;
    } catch {
      return null;
    }
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function coerceFormValues(
  raw: RawPersisted['values'] | undefined,
): OnboardingFormValues {
  const v = raw ?? {};
  return {
    ...defaultFormValues(),
    name: asString(v.name),
    connect: asString(v.connect),
    teslaVehicleId: asString(v.teslaVehicleId),
  };
}

export function readPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  const raw = readFirstStoredEntry();
  if (!raw) return null;
  return {
    step: coerceStoredStep(raw.currentStep),
    values: coerceFormValues(raw.values),
  };
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
    window.sessionStorage.removeItem(STORAGE_KEY_V3);
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
