import { useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { useState } from 'react';
import type {
  AuthFlowMode,
  UseGoogleOAuthResult,
} from '#/features/auth/types/auth-flows';
import { googleOAuthSsoParams } from '#/features/auth/utils/google-oauth-sso';

/**
 * Encapsulates the Google OAuth handshake for both `/sign-in` and `/sign-up`.
 * Clerk's SignIn/SignUp resource objects are equivalent for OAuth flows, so we
 * switch between them via `mode` and expose a single `{ start, submitting,
 * error, ready }` API to both pages.
 */
export function useGoogleOAuth(mode: AuthFlowMode): UseGoogleOAuthResult {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resource = mode === 'sign-in' ? signIn : signUp;
  const fallbackMessage =
    mode === 'sign-in'
      ? 'Unable to start Google sign-in.'
      : 'Unable to start Google sign-up.';

  const start = async () => {
    if (!resource) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: ssoError } = await resource.sso(googleOAuthSsoParams);
      if (ssoError) {
        setError(ssoError.message ?? fallbackMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return { start, submitting, error, ready: Boolean(resource) };
}
