import { useForm } from '@tanstack/react-form';
import type { OnboardingFormValues } from '#/features/onboarding/types/steps';

/**
 * Onboarding wizard fields only — same pattern as {@link usePlanForm}.
 */
export function useOnboardingForm(defaultValues: OnboardingFormValues) {
  return useForm({
    defaultValues,
  });
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
