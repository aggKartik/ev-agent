import { useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import type {
  AuthFlowMode,
  EmailCodeStage,
  UseEmailCodeAuthResult,
} from '#/features/auth/types/auth-flows';
import { emptyOnboardingSearch } from '#/features/onboarding/utils/search';

type SignInResource = NonNullable<ReturnType<typeof useSignIn>['signIn']>;
type SignUpResource = NonNullable<ReturnType<typeof useSignUp>['signUp']>;

type StartResult = { error: string | null };
type VerifyResult = { error?: string; complete?: boolean; status?: string };

/**
 * Email-code (OTP) auth flow for both `/sign-in` and `/sign-up`. Mirrors the
 * shape of `useGoogleOAuth` so the two can live side-by-side on the same page.
 *
 * On development Clerk instances, any email with the `+clerk_test` subaddress
 * short-circuits the email transport and verifies with the fixed code
 * `424242` — see https://clerk.com/docs/guides/development/testing/test-emails-and-phones.
 * That's what makes this flow usable as a no-Google test-user entry point.
 *
 * The hook transparently falls back between sign-in and sign-up: if we try to
 * sign in an unknown email (or sign up an existing one), we swap resources and
 * re-start so the caller never has to care which mode the user actually needs.
 */
export function useEmailCodeAuth(
  initialMode: AuthFlowMode = 'sign-in',
): UseEmailCodeAuthResult {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();

  const [mode, setMode] = useState<AuthFlowMode>(initialMode);
  const [stage, setStage] = useState<EmailCodeStage>('email');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = mode === 'sign-in' ? Boolean(signIn) : Boolean(signUp);

  const navigateOnSuccess = () =>
    router.navigate({ to: '/onboarding', search: emptyOnboardingSearch });

  const runAction = async (fn: () => Promise<void>) => {
    setError(null);
    setSubmitting(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  const startInMode = (
    address: string,
    targetMode: AuthFlowMode,
  ): Promise<StartResult> =>
    targetMode === 'sign-in'
      ? startSignIn(signIn, address)
      : startSignUp(signUp, address);

  const start = (inputEmail: string) =>
    runAction(async () => {
      const trimmed = inputEmail.trim();
      if (!trimmed) {
        setError('Enter an email address.');
        return;
      }

      let result = await startInMode(trimmed, mode);

      // Fall back to the opposite resource if the user picked the wrong mode.
      if (result.error && isUnknownIdentifierError(result.error)) {
        const fallback: AuthFlowMode =
          mode === 'sign-in' ? 'sign-up' : 'sign-in';
        result = await startInMode(trimmed, fallback);
        if (!result.error) setMode(fallback);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setEmail(trimmed);
      setStage('code');
    });

  const verify = (code: string) =>
    runAction(async () => {
      const trimmed = code.trim();
      if (!trimmed) {
        setError('Enter the 6-digit code.');
        return;
      }

      const result =
        mode === 'sign-in'
          ? await verifySignIn(signIn, trimmed)
          : await verifySignUp(signUp, trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.complete) {
        const resource = mode === 'sign-in' ? signIn : signUp;
        await resource?.finalize({ navigate: navigateOnSuccess });
        return;
      }
      setError(`${authLabel(mode)} not complete (status: ${result.status}).`);
    });

  const resend = () =>
    runAction(async () => {
      if (!email) return;
      const sendError =
        mode === 'sign-in'
          ? await resendSignIn(signIn, email)
          : await resendSignUp(signUp);
      if (sendError) setError(sendError);
    });

  const reset = () => {
    setStage('email');
    setError(null);
  };

  return {
    stage,
    email,
    submitting,
    error,
    ready,
    start,
    verify,
    resend,
    reset,
  };
}

async function startSignIn(
  signIn: SignInResource | undefined,
  address: string,
): Promise<StartResult> {
  if (!signIn) return { error: 'Sign-in resource not ready.' };
  const { error: createError } = await signIn.create({ identifier: address });
  if (createError) return { error: mapClerkError(createError) };
  const { error: sendError } = await signIn.emailCode.sendCode({
    emailAddress: address,
  });
  if (sendError) return { error: mapClerkError(sendError) };
  return { error: null };
}

async function startSignUp(
  signUp: SignUpResource | undefined,
  address: string,
): Promise<StartResult> {
  if (!signUp) return { error: 'Sign-up resource not ready.' };
  const { error: createError } = await signUp.create({ emailAddress: address });
  if (createError) return { error: mapClerkError(createError) };
  const { error: sendError } = await signUp.verifications.sendEmailCode();
  if (sendError) return { error: mapClerkError(sendError) };
  return { error: null };
}

async function verifySignIn(
  signIn: SignInResource | undefined,
  code: string,
): Promise<VerifyResult> {
  if (!signIn) return { error: 'Sign-in resource not ready.' };
  const { error } = await signIn.emailCode.verifyCode({ code });
  if (error) return { error: mapClerkError(error) };
  return { complete: signIn.status === 'complete', status: signIn.status };
}

async function verifySignUp(
  signUp: SignUpResource | undefined,
  code: string,
): Promise<VerifyResult> {
  if (!signUp) return { error: 'Sign-up resource not ready.' };
  const { error } = await signUp.verifications.verifyEmailCode({ code });
  if (error) return { error: mapClerkError(error) };
  return { complete: signUp.status === 'complete', status: signUp.status };
}

async function resendSignIn(
  signIn: SignInResource | undefined,
  address: string,
): Promise<string | null> {
  if (!signIn) return null;
  const { error } = await signIn.emailCode.sendCode({ emailAddress: address });
  return error ? mapClerkError(error) : null;
}

async function resendSignUp(
  signUp: SignUpResource | undefined,
): Promise<string | null> {
  if (!signUp) return null;
  const { error } = await signUp.verifications.sendEmailCode();
  return error ? mapClerkError(error) : null;
}

function authLabel(mode: AuthFlowMode): 'Sign-in' | 'Sign-up' {
  return mode === 'sign-in' ? 'Sign-in' : 'Sign-up';
}

type ClerkErrorShape = {
  message?: string;
  longMessage?: string;
  code?: string;
};

function mapClerkError(err: unknown): string {
  if (!err) return 'Unknown error.';
  if (typeof err === 'string') return err;
  const candidate = err as ClerkErrorShape;
  return candidate.longMessage ?? candidate.message ?? 'Something went wrong.';
}

function isUnknownIdentifierError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("couldn't find your account") ||
    lower.includes('no account found') ||
    lower.includes('already exists') ||
    lower.includes('taken')
  );
}
