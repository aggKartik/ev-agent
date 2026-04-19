import type { ReactNode } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Header from '#/components/Header';
import { css } from '../../../styled-system/css';

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

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <Box className={overlayClass}>
      <Box className="app-container">
        <Box className="stars" />
        <Box className="sun" />
        <Box className="horizon">
          <Box className="horizon-grid" />
        </Box>

        <Stack className={shellClass}>
          <Header showMeta={false} />
          <Box className={stageClass}>
            <Box className={stageInnerClass}>{children}</Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
