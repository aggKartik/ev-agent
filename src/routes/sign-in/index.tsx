import { useSignIn } from '@clerk/tanstack-react-start';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import GoogleButton from '#/components/auth/GoogleButton';
import { Text } from '#/components/Text';
import { css } from '../../../styled-system/css';
import { step } from '../../../styled-system/recipes/step';

export const Route = createFileRoute('/sign-in/')({ component: SignInRoute });

const actionsClass = css({
  marginTop: '5.5',
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const altLinkClass = css({
  marginTop: '4',
  fontFamily: 'mono',
  fontSize: '12px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'cream.600',
  '& a': {
    color: 'peach.400',
    textDecoration: 'none',
    _hover: { textDecoration: 'underline' },
  },
});

const errorClass = css({
  marginTop: '4',
  fontSize: '13px',
  color: 'magenta.400',
  maxWidth: '420px',
  textAlign: 'center',
});

const kickerClass = css({
  textStyle: 'mono-kicker',
  color: 'peach.400',
  marginBottom: '3.5',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2.5',
  '&::before': {
    content: '""',
    width: '22px',
    height: '1px',
    background: 'peach.400',
    display: 'inline-block',
  },
});

function SignInRoute() {
  const { signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { error: ssoError } = await signIn.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/onboarding',
      });
      if (ssoError) {
        setError(ssoError.message ?? 'Unable to start Google sign-in.');
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
          <Box className={kickerClass}>SIGN IN</Box>
          <Text as="h1" className={stepClasses.title}>
            Welcome <Box as="em">back</Box>.
          </Text>
          <Text className={stepClasses.desc}>
            Continue with Google to pick up where you left off.
          </Text>
          <Stack direction="row" className={actionsClass}>
            <GoogleButton onClick={handleGoogle} loading={submitting} />
          </Stack>
          {error ? <Box className={errorClass}>{error}</Box> : null}
          <Box className={altLinkClass}>
            New here? <Link to="/sign-up">Create an account</Link>
          </Box>
          <Box id="clerk-captcha" />
        </Stack>
      </Box>
    </AuthShell>
  );
}
