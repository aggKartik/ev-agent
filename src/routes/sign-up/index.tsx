import { useSignUp } from '@clerk/tanstack-react-start';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import GoogleButton from '#/components/auth/GoogleButton';
import { Text } from '#/components/Text';
import { css } from '../../../styled-system/css';
import { step } from '../../../styled-system/recipes/step';

export const Route = createFileRoute('/sign-up/')({ component: SignUpRoute });

const actionsClass = css({
  marginTop: '5.5',
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const altLinkAnchorClass = css({
  color: 'peach.400',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
});

function SignUpRoute() {
  const { signUp } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    if (!signUp) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: ssoError } = await signUp.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/onboarding',
      });
      if (ssoError) {
        setError(ssoError.message ?? 'Unable to start Google sign-up.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepClasses = step({ single: true });

  return (
    <AuthShell>
      <Box className={stepClasses.card}>
        <Stack textAlign="center" alignItems="center" gap="0">
          <Box className={stepClasses.kicker}>SIGN UP</Box>
          <Text as="h1" className={stepClasses.title}>
            Start your <Box as="em">first trip</Box>.
          </Text>
          <Text className={stepClasses.desc}>
            Sign up with Google in one tap — we'll set up your garage and route
            preferences next.
          </Text>
          <Stack direction="row" className={actionsClass}>
            <GoogleButton onClick={handleGoogle} loading={submitting} />
          </Stack>
          {error ? (
            <Text
              textStyle="caption"
              color="magenta.400"
              marginTop="4"
              maxWidth="420px"
            >
              {error}
            </Text>
          ) : null}
          <Text as="div" textStyle="mono-meta" color="cream.600" marginTop="4">
            Already have an account?{' '}
            <Link to="/sign-in" className={altLinkAnchorClass}>
              Sign in
            </Link>
          </Text>
          <Box id="clerk-captcha" />
        </Stack>
      </Box>
    </AuthShell>
  );
}
