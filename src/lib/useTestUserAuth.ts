import { useSignIn } from '@clerk/tanstack-react-start/legacy';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * Local/CI-friendly auth that does not require Google.
 *
 * Flow (per Clerk's [sign-in-token docs](https://clerk.com/docs/references/backend/sign-in-tokens/create-sign-in-token)):
 * 1. Ask our own server to mint a single-use sign-in token
 *    (`POST /api/auth/test-user-token`). The server uses
 *    `CLERK_SECRET_KEY` to find-or-create a dedicated test user and call
 *    `clerkClient().signInTokens.createSignInToken({ userId })`.
 * 2. Redeem the token in the browser via the Core 2 API:
 *    `signIn.create({ strategy: 'ticket', ticket })` →
 *    `setActive({ session: createdSessionId })`.
 *
 * We deliberately use the **legacy** `useSignIn` import here. The new
 * Future API's `signIn.ticket()` has a known bug where status stays at
 * `needs_identifier` after redeeming a sign-in token (Clerk GH issue
 * [#8219](https://github.com/clerk/javascript/issues/8219)), so the only
 * reliable redemption path right now is Core 2's
 * `signIn.create({ strategy: 'ticket', ticket })`.
 *
 * This path sidesteps the Frontend API's identifier validation entirely,
 * which is what broke the previous `signIn.create({ identifier })`
 * attempt against our Google-only Clerk instance.
 */

type UseTestUserAuthResult = {
  start: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  ready: boolean;
};

export function useTestUserAuth(): UseTestUserAuthResult {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ready = isLoaded;

  const start = async () => {
    if (!isLoaded) return;
    setError(null);
    setSubmitting(true);

    try {
      const ticket = await fetchTicket();
      const result = await signIn.create({ strategy: 'ticket', ticket });

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(
          `Clerk did not complete the test sign-in (status: ${result.status}).`,
        );
      }

      await setActive({ session: result.createdSessionId });
      await navigate({ to: '/onboarding' });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unexpected error signing in as test user.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return { start, submitting, error, ready };
}

async function fetchTicket(): Promise<string> {
  const res = await fetch('/api/auth/test-user-token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) {
    throw new Error(
      'Test-user auth is disabled on this server. Set ENABLE_TEST_USER_AUTH=true.',
    );
  }
  if (!res.ok) {
    const body = await safeReadJson(res);
    throw new Error(
      body?.error ??
        `Test-user token endpoint failed with status ${res.status}.`,
    );
  }
  const body = await res.json();
  if (typeof body?.ticket !== 'string') {
    throw new Error('Test-user token endpoint returned an invalid payload.');
  }
  return body.ticket;
}

async function safeReadJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
