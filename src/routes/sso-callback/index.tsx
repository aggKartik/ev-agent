import { useClerk, useSignIn, useSignUp } from '@clerk/tanstack-react-start';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import Spinner from '#/components/Spinner';
import { Text } from '#/components/Text';

export const Route = createFileRoute('/sso-callback/')({
  component: SsoCallbackRoute,
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

    if (!clerk.loaded || !signIn || !signUp || hasRun.current) {
      return;
    }
    hasRun.current = true;

    (async () => {
      try {
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
          const signInStatus = signIn.status as
            | typeof signIn.status
            | 'complete';
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
      } catch (err) {
        console.error('SSO callback failed:', err);
        hasRun.current = false;
        navigateToSignIn();
      }
    })();
  }, [clerk, signIn, signUp, navigate]);

  return (
    <AuthShell>
      <Stack alignItems="center" gap="5" paddingY="10" textAlign="center">
        <Spinner size="32px" label="Completing sign-in" />
        <Text textStyle="mono-meta" color="cream.600">
          Completing sign-in…
        </Text>
        <Box id="clerk-captcha" />
      </Stack>
    </AuthShell>
  );
}
