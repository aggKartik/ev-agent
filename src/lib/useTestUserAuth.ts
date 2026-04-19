import { useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * Local/CI-friendly auth that does not require Google.
 *
 * Clerk development instances have "test mode" enabled by default. Any email
 * using the `+clerk_test` subaddress is treated as a test address: Clerk will
 * accept the universal verification code `424242` for it without sending a
 * real email. This lets humans and AI agents sign into the app locally
 * without bouncing through Google's OAuth consent screen.
 *
 * Docs: https://clerk.com/docs/guides/development/testing/test-emails-and-phones
 *
 * Behaviour:
 * - First try the `signIn` email-code flow (Future API):
 *   `signIn.create({ identifier, strategy: 'email_code' })` ->
 *   `signIn.emailCode.sendCode()` -> `signIn.emailCode.verifyCode({ code })`.
 * - If Clerk responds with `form_identifier_not_found` (i.e. the test user
 *   has never been provisioned on this Clerk instance), fall back to
 *   `signUp.create` + `sendEmailCode` + `verifyEmailCode` to create the
 *   user, then finalize the session.
 *
 * The hook mirrors the shape of `useGoogleOAuth` so the UI can swap them
 * without special-casing.
 */

export const DEFAULT_TEST_USER_EMAIL = 'ev-agent-test+clerk_test@example.com';
export const TEST_USER_VERIFICATION_CODE = '424242';

type UseTestUserAuthResult = {
  start: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  ready: boolean;
  email: string;
};

type MaybeClerkError =
  | {
      code?: string;
      message?: string;
    }
  | null
  | undefined;

export function useTestUserAuth(
  email: string = DEFAULT_TEST_USER_EMAIL,
): UseTestUserAuthResult {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ready = Boolean(signIn && signUp);

  const start = async () => {
    if (!ready || !signIn || !signUp) return;
    setError(null);
    setSubmitting(true);

    try {
      const signInError = await runSignInFlow(signIn, email);

      if (signInError && isIdentifierNotFound(signInError)) {
        const signUpError = await runSignUpFlow(signUp, email);
        if (signUpError) {
          throw new Error(describeError(signUpError, 'Test sign-up failed.'));
        }
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          throw new Error(
            describeError(finalizeError, 'Could not activate test session.'),
          );
        }
      } else if (signInError) {
        throw new Error(describeError(signInError, 'Test sign-in failed.'));
      } else {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          throw new Error(
            describeError(finalizeError, 'Could not activate test session.'),
          );
        }
      }

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

  return { start, submitting, error, ready, email };
}

async function runSignInFlow(
  signIn: NonNullable<ReturnType<typeof useSignIn>['signIn']>,
  email: string,
): Promise<MaybeClerkError> {
  const createRes = await signIn.create({ identifier: email });
  if (createRes.error) return createRes.error;

  const sendRes = await signIn.emailCode.sendCode();
  if (sendRes.error) return sendRes.error;

  const verifyRes = await signIn.emailCode.verifyCode({
    code: TEST_USER_VERIFICATION_CODE,
  });
  return verifyRes.error;
}

async function runSignUpFlow(
  signUp: NonNullable<ReturnType<typeof useSignUp>['signUp']>,
  email: string,
): Promise<MaybeClerkError> {
  const createRes = await signUp.create({ emailAddress: email });
  if (createRes.error) return createRes.error;

  const sendRes = await signUp.verifications.sendEmailCode();
  if (sendRes.error) return sendRes.error;

  const verifyRes = await signUp.verifications.verifyEmailCode({
    code: TEST_USER_VERIFICATION_CODE,
  });
  return verifyRes.error;
}

function isIdentifierNotFound(err: MaybeClerkError): boolean {
  return err?.code === 'form_identifier_not_found';
}

function describeError(err: MaybeClerkError, fallback: string): string {
  if (!err) return fallback;
  return err.message ?? fallback;
}
