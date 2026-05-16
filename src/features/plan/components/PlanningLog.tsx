import { Box, Stack } from 'styled-system/jsx';
import { useCurrentPhase, useNarration } from '#/features/plan/store';
import { cleanPlanAddress } from '#/features/plan/utils/helpers';
import type { PlanRequest } from '#/shared/plan/contracts';
import { css, cx } from '#/styled-system/css';
import { panel } from '#/styled-system/recipes/panel';
import { progress } from '#/styled-system/recipes/progress';

type PlanningLogProps = {
  request: PlanRequest;
};

const EXPECTED_PHASES = 5;

const rootClass = css({
  width: 'full',
  maxWidth: 'panel-form',
  justifySelf: 'end',
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '320px',
  '@media (min-width: 880px)': {
    height: 'calc(100dvh - 96px)',
    maxHeight: 'calc(100dvh - 96px)',
  },
});

const headerClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '5',
  py: '4',
  borderBottomWidth: 'hair',
  borderBottomColor: 'alpha.cream.10',
  textStyle: 'mono-meta',
  fontSize: '2xs',
  letterSpacing: '0.18em',
  color: 'cream.600',
});

const bodyClass = css({
  flex: '1 1 auto',
  minHeight: 0,
  p: '5',
  maxHeight: { base: '320px', lg: '520px' },
  overflowY: 'auto',
  fontFamily: 'mono',
  fontSize: 'caption',
  lineHeight: '1.65',
  '@media (min-width: 880px)': {
    maxHeight: 'none',
  },
});

const lineClass = css({
  display: 'grid',
  gridTemplateColumns: '{spacing.6} 1fr',
  gap: '2',
  color: 'cream.500',
  '&[data-active=true]': {
    color: 'peach.300',
  },
});

const detailClass = css({
  gridColumn: '2',
  color: 'cream.700',
});

export default function PlanningLog({ request }: PlanningLogProps) {
  const narration = useNarration();
  const currentPhase = useCurrentPhase();
  const phasesSeen = narration.filter((entry) =>
    entry.text.startsWith('→'),
  ).length;
  const pct = Math.min(
    100,
    Math.max(8, Math.round((phasesSeen / EXPECTED_PHASES) * 100)),
  );
  const progressClasses = progress({ size: 'terminal' });
  const headerLines = [
    { token: '→', message: 'boot :: ev-agent/0.4.2 · session 9f2c' },
    { token: '.', message: `origin :: ${cleanPlanAddress(request.from.full)}` },
    { token: '.', message: `target :: ${cleanPlanAddress(request.to.full)}` },
    ...request.activities.map((activity) => ({
      token: '.',
      message: `want :: ${activity.id} · ${activity.dwellMinutes}m · ${activity.targetRoutePercent}% route`,
    })),
  ];

  return (
    <Box className={cx(panel({ variant: 'terminal' }), rootClass)}>
      <Box className={headerClass}>
        <span>AGENT · PLANNING</span>
        <span aria-live="polite">{pct}%</span>
      </Box>
      <Box
        className={progressClasses.track}
        role="progressbar"
        aria-label="Planning progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <Box className={progressClasses.fill} style={{ width: `${pct}%` }} />
      </Box>
      <Stack className={bodyClass} gap="1" aria-live="polite">
        {currentPhase ? (
          <Box className={lineClass} data-active={true}>
            <span>▸</span>
            <span>{currentPhase.label}</span>
            {currentPhase.detail ? (
              <Box className={detailClass}>{currentPhase.detail}</Box>
            ) : null}
          </Box>
        ) : null}
        {headerLines.map((line) => (
          <Box key={`${line.token}-${line.message}`} className={lineClass}>
            <span>{line.token}</span>
            <span>{line.message}</span>
          </Box>
        ))}
        {narration.map((entry) => {
          const isPhase = entry.text.startsWith('→');
          const token = isPhase ? '✓' : '·';
          const text = isPhase ? entry.text.slice(1).trim() : entry.text;
          return (
            <Box key={entry.id} className={lineClass}>
              <span>{token}</span>
              <span>{text}</span>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
