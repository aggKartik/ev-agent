import { auth } from '@clerk/tanstack-react-start/server';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const requireAuthFn = createServerFn().handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw redirect({ to: '/sign-in' });
  }

  return { userId };
});

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => await requireAuthFn(),
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return <Outlet />;
}
