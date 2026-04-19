import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import GoogleButton from '#/components/auth/GoogleButton';
import { Text } from '#/components/Text';
import { useGoogleOAuth } from '#/lib/useGoogleOAuth';
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
  const { start, submitting, error } = useGoogleOAuth('sign-up');
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
            <GoogleButton onClick={start} loading={submitting} />
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
