import { useClerk, useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import { Text } from '#/components/Text';
import { css } from '../../../styled-system/css';

export const Route = createFileRoute('/sso-callback/')({
  component: SsoCallbackRoute,
});

const wrapperClass = css({
  textAlign: 'center',
  maxWidth: '520px',
  paddingY: '10',
});

const spinnerClass = css({
  width: '32px',
  height: '32px',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: 'alpha.cream-28',
  borderTopColor: 'peach.400',
  borderRadius: 'full',
  animation: 'spin 1s linear infinite',
  marginInline: 'auto',
});

const labelClass = css({
  marginTop: '5',
  textStyle: 'mono-meta',
  fontSize: '12px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'cream.600',
});

function SsoCallbackRoute() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    const navigateTo = (to: string) => {
      if (to.startsWith('http')) {
        window.location.href = to;
      } else {
        void navigate({ to });
      }
    };

    const navigateToSignIn = () => navigateTo('/sign-in');

    (async () => {
      if (!clerk.loaded || hasRun.current) {
        return;
      }
      hasRun.current = true;

      const finalizeSignIn = async () => {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              return;
            }
            const url = decorateUrl('/onboarding');
            navigateTo(url);
          },
        });
      };

      const finalizeSignUp = async () => {
        await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              return;
            }
            const url = decorateUrl('/onboarding');
            navigateTo(url);
          },
        });
      };

      if (signIn.status === 'complete') {
        await finalizeSignIn();
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        const signInStatus = signIn.status as typeof signIn.status | 'complete';
        if (signInStatus === 'complete') {
          await finalizeSignIn();
          return;
        }
        navigateToSignIn();
        return;
      }

      if (
        signIn.status === 'needs_first_factor' &&
        !signIn.supportedFirstFactors?.every(
          (f) => f.strategy === 'enterprise_sso',
        )
      ) {
        navigateToSignIn();
        return;
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === 'complete') {
          await finalizeSignUp();
          return;
        }
        navigateTo('/sign-up');
        return;
      }

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      if (
        signIn.status === 'needs_second_factor' ||
        signIn.status === 'needs_new_password'
      ) {
        navigateToSignIn();
        return;
      }

      if (signIn.existingSession || signUp.existingSession) {
        const sessionId =
          signIn.existingSession?.sessionId ||
          signUp.existingSession?.sessionId;
        if (sessionId) {
          await clerk.setActive({
            session: sessionId,
            navigate: async ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                return;
              }
              const url = decorateUrl('/onboarding');
              navigateTo(url);
            },
          });
        }
      }
    })();
  }, [clerk, signIn, signUp, navigate]);

  return (
    <AuthShell>
      <Box className={wrapperClass}>
        <Stack alignItems="center" gap="0">
          <Box className={spinnerClass} aria-hidden="true" />
          <Text className={labelClass}>Completing sign-in…</Text>
        </Stack>
        <Box id="clerk-captcha" />
      </Box>
    </AuthShell>
  );
}
