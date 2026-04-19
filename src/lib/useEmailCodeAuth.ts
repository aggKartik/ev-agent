import { useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';

type Mode = 'sign-in' | 'sign-up';
type Stage = 'email' | 'code';

type UseEmailCodeAuthResult = {
  stage: Stage;
  email: string;
  submitting: boolean;
  error: string | null;
  ready: boolean;
  start: (email: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  reset: () => void;
};

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
  initialMode: Mode = 'sign-in',
): UseEmailCodeAuthResult {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = mode === 'sign-in' ? Boolean(signIn) : Boolean(signUp);

  const navigateOnSuccess = () => {
    router.navigate({ to: '/onboarding' });
  };

  const startSignIn = async (address: string) => {
    if (!signIn) return { error: 'Sign-in resource not ready.' } as const;
    const { error: createError } = await signIn.create({
      identifier: address,
    });
    if (createError) return { error: mapClerkError(createError) } as const;
    const { error: sendError } = await signIn.emailCode.sendCode({
      emailAddress: address,
    });
    if (sendError) return { error: mapClerkError(sendError) } as const;
    return { error: null } as const;
  };

  const startSignUp = async (address: string) => {
    if (!signUp) return { error: 'Sign-up resource not ready.' } as const;
    const { error: createError } = await signUp.create({
      emailAddress: address,
    });
    if (createError) return { error: mapClerkError(createError) } as const;
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) return { error: mapClerkError(sendError) } as const;
    return { error: null } as const;
  };

  const start = async (inputEmail: string) => {
    const trimmed = inputEmail.trim();
    if (!trimmed) {
      setError('Enter an email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let result =
        mode === 'sign-in'
          ? await startSignIn(trimmed)
          : await startSignUp(trimmed);

      // Fall back to the opposite resource if the user picked the wrong mode.
      if (result.error && isUnknownIdentifierError(result.error)) {
        const fallback: Mode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
        result =
          fallback === 'sign-in'
            ? await startSignIn(trimmed)
            : await startSignUp(trimmed);
        if (!result.error) setMode(fallback);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setEmail(trimmed);
      setStage('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        if (!signIn) return;
        const { error: verifyError } = await signIn.emailCode.verifyCode({
          code: trimmed,
        });
        if (verifyError) {
          setError(mapClerkError(verifyError));
          return;
        }
        if (signIn.status === 'complete') {
          await signIn.finalize({ navigate: navigateOnSuccess });
        } else {
          setError(`Sign-in not complete (status: ${signIn.status}).`);
        }
      } else {
        if (!signUp) return;
        const { error: verifyError } =
          await signUp.verifications.verifyEmailCode({ code: trimmed });
        if (verifyError) {
          setError(mapClerkError(verifyError));
          return;
        }
        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: navigateOnSuccess });
        } else {
          setError(`Sign-up not complete (status: ${signUp.status}).`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'sign-in' && signIn) {
        const { error: sendError } = await signIn.emailCode.sendCode({
          emailAddress: email,
        });
        if (sendError) setError(mapClerkError(sendError));
      } else if (mode === 'sign-up' && signUp) {
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) setError(mapClerkError(sendError));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

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
