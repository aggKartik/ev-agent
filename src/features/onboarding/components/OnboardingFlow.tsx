import { Box } from 'styled-system/jsx';
import AppShell from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import OnboardingOrchestrator from '#/features/onboarding/components/OnboardingOrchestrator';
import { useOnboardingInitialState } from '#/features/onboarding/hooks/useOnboardingInitialState';
import type { OnboardingFormValues } from '#/features/onboarding/types/steps';
import type { OnboardingSearch } from '#/features/onboarding/utils/search';
import { trpc } from '#/lib/trpc';
import { onboarding } from '#/styled-system/recipes';

type OnboardingFlowProps = {
  search: OnboardingSearch;
};

/**
 * Tesla-first onboarding: waits for `user.profile` once so the name field can
 * be seeded from Clerk without a `useEffect` that races user input (TanStack
 * Form ignores `defaultValues` changes after mount).
 */
export default function OnboardingFlow({ search }: OnboardingFlowProps) {
  const initial = useOnboardingInitialState();
  const profileQuery = trpc.user.profile.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  const o = onboarding();

  if (!profileQuery.isFetched) {
    return (
      <AppShell
        header={
          <Header
            sessionLabel="SESSION · --/--"
            buildLabel="v1.0 BETA"
            showMeta
          />
        }
        background="horizon-only"
        stage="onboarding"
        stageTopAlign={false}
      >
        <Box className={o.loading}>Loading your profile…</Box>
      </AppShell>
    );
  }

  const clerkFirst = profileQuery.data?.firstName?.trim() ?? '';
  const defaultValues: OnboardingFormValues = {
    ...initial.values,
    name: initial.values.name.trim() || clerkFirst,
  };

  return (
    <OnboardingOrchestrator
      search={search}
      initialStep={initial.step}
      defaultValues={defaultValues}
    />
  );
}
