import { createFileRoute } from '@tanstack/react-router';
import OnboardingFlow from '#/features/onboarding/components/OnboardingFlow';
import { parseOnboardingSearch } from '#/features/onboarding/utils/search';

export const Route = createFileRoute('/onboarding/')({
  validateSearch: parseOnboardingSearch,
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const search = Route.useSearch();
  return <OnboardingFlow search={search} />;
}
