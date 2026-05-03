import { auth } from '@clerk/tanstack-react-start/server';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { hasVehicleForClerkUser } from '#/server/users/requireVehicle';

const inputSchema = z.object({ force: z.boolean().optional() });

/**
 * Auth + onboarding-state gate. If the **Driver** already has a `vehicles`
 * row they get bounced to `/dashboard` so reload doesn't drop them back
 * into the funnel. The dashboard's "Re-run setup" link bypasses this with
 * `?force=1` so a Driver can swap cars or relink Tesla without us having
 * to add a separate `/settings/vehicle` page.
 */
const requireUnonboardedFn = createServerFn({ method: 'GET' })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      throw redirect({ to: '/sign-in' });
    }

    if (data.force) return { userId };

    const onboarded = await hasVehicleForClerkUser(userId);
    if (onboarded) {
      throw redirect({ to: '/dashboard' });
    }

    return { userId };
  });

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ search }) => {
    const force = (search as { force?: unknown }).force;
    return await requireUnonboardedFn({
      data: { force: force === '1' || force === true || force === 'true' },
    });
  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return <Outlet />;
}
