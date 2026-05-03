import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import { resolveClerkFirstName } from '#/server/users';

/**
 * Current-user procedures. Today this exposes a thin `profile` query so the
 * onboarding flow can prefill the NAME step with Clerk's first name when
 * the user signed in via an OAuth provider that populated it (Google). Email-
 * code sign-ins return `firstName: null` and the UI falls back to an empty
 * input.
 */
export const userRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const firstName = await resolveClerkFirstName(ctx.clerkUserId);
    return { firstName };
  }),
});
