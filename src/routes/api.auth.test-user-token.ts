import { createFileRoute } from '@tanstack/react-router';
import {
  issueTestUserSignInToken,
  isTestUserAuthEnabled,
} from '#/server/auth/testUser';

/**
 * POST /api/auth/test-user-token
 *
 * Returns `{ ticket }`, a single-use Clerk sign-in token that the browser
 * redeems via `signIn.create({ strategy: 'ticket', ticket })`. Only
 * available when `ENABLE_TEST_USER_AUTH=true`; otherwise returns 404 so
 * production builds don't advertise the endpoint's existence.
 *
 * There is no request body — the endpoint always signs in the same stable
 * test user. If we ever need per-branch or per-agent test users we can
 * accept an identifier in the body and look it up on the server.
 */
export const Route = createFileRoute('/api/auth/test-user-token')({
  server: {
    handlers: {
      POST: async () => {
        if (!isTestUserAuthEnabled()) {
          return new Response('Not Found', { status: 404 });
        }

        try {
          const { ticket } = await issueTestUserSignInToken();
          return Response.json({ ticket });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[test-user-token] failed to mint token:', err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
