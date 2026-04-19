import { clerkClient } from '@clerk/tanstack-react-start/server';

/**
 * Server-only glue for the "Continue as test user" flow.
 *
 * Why this file exists:
 * - Our Clerk instance only has Google OAuth enabled as a first factor, so
 *   the Frontend API rejects password/email identifiers with
 *   `form_param_format_invalid`. We can't sign the test user in from the
 *   browser alone.
 * - Clerk's documented workaround is Backend-API-issued
 *   [sign-in tokens](https://clerk.com/docs/references/backend/sign-in-tokens/create-sign-in-token):
 *   the server uses `CLERK_SECRET_KEY` to mint a single-use JWT for a
 *   specific user, and the browser redeems it via `signIn.create({
 *   strategy: 'ticket', ticket })`. This flow ignores identifier
 *   configuration — it authenticates the user directly.
 *
 * The test user is looked up (or lazily created) by a stable
 * `externalId = 'ev-agent-test-user'` so:
 * 1. We never collide with real users.
 * 2. We never need to know the user's Clerk ID ahead of time.
 * 3. Re-running the flow reuses the same account across restarts.
 */

const TEST_USER_EXTERNAL_ID = 'ev-agent-test-user';
const TEST_USER_EMAIL = 'ev-agent-test+clerk_test@example.com';
const TEST_USER_FIRST_NAME = 'Test';
const TEST_USER_LAST_NAME = 'User';
// Short lifetime: the browser redeems the token immediately after fetching
// it, so there is no legitimate reason for a token to sit around for longer.
const TOKEN_LIFETIME_SECONDS = 60;

export function isTestUserAuthEnabled(): boolean {
  return process.env.ENABLE_TEST_USER_AUTH === 'true';
}

export async function issueTestUserSignInToken(): Promise<{ ticket: string }> {
  if (!isTestUserAuthEnabled()) {
    throw new Error('test-user auth is disabled');
  }

  const clerk = clerkClient();
  const user = await findOrCreateTestUser(clerk);

  const token = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: TOKEN_LIFETIME_SECONDS,
  });

  return { ticket: token.token };
}

type Clerk = ReturnType<typeof clerkClient>;

async function findOrCreateTestUser(clerk: Clerk) {
  const existing = await clerk.users.getUserList({
    externalId: [TEST_USER_EXTERNAL_ID],
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];

  return clerk.users.createUser({
    externalId: TEST_USER_EXTERNAL_ID,
    emailAddress: [TEST_USER_EMAIL],
    firstName: TEST_USER_FIRST_NAME,
    lastName: TEST_USER_LAST_NAME,
    skipPasswordRequirement: true,
  });
}
