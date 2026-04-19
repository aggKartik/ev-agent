import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import Header from '#/components/Header';
import WelcomeStep from '#/components/onboarding/WelcomeStep';
import { css } from '../../styled-system/css';

export const Route = createFileRoute('/')({ component: WelcomeRoute });

const overlayClass = css({
  position: 'fixed',
  inset: 0,
  zIndex: '60',
});

const shellClass = css({
  position: 'relative',
  width: 'full',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 2,
});

const stageClass = css({
  position: 'relative',
  zIndex: 5,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: { base: '5', md: '10' },
  pt: { base: '6', md: '6' },
  pb: { base: '16', md: '20' },
  overflowY: 'auto',
});

const stageInnerClass = css({
  width: 'full',
  maxWidth: '86rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  alignItems: 'center',
  px: { base: '6', md: '10' },
});

function WelcomeRoute() {
  const navigate = useNavigate();

  const handleContinue = () => {
    void navigate({ to: '/onboarding' });
  };

  return (
    <Box className={overlayClass}>
      <Box className="app-container">
        <Box className="stars" />
        <Box className="sun" />
        <Box className="horizon">
          <Box className="horizon-grid" />
        </Box>

        <Stack className={shellClass}>
          <Header
            sessionLabel="SESSION · 00/09"
            buildLabel="v1.0 BETA"
            showMeta
          />
          <Box className={stageClass}>
            <Box className={stageInnerClass}>
              <WelcomeStep onContinue={handleContinue} />
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
