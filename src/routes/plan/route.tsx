import { auth } from '@clerk/tanstack-react-start/server';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { emptyOnboardingSearch } from '#/features/onboarding/utils/search';
import { hasVehicleForClerkUser } from '#/server/users/requireVehicle';

const requireOnboardedFn = createServerFn().handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    throw redirect({ to: '/sign-in' });
  }

  const onboarded = await hasVehicleForClerkUser(userId);
  if (!onboarded) {
    throw redirect({ to: '/onboarding', search: emptyOnboardingSearch });
  }

  return { userId };
});

export const Route = createFileRoute('/plan')({
  beforeLoad: async () => await requireOnboardedFn(),
  component: PlanLayout,
});

function PlanLayout() {
  return <Outlet />;
}
