import { Box, Stack } from 'styled-system/jsx';
import type { PlanRequest, PlanResult } from '#/features/plan/contracts';
import { cleanPlanAddress } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';
import { panel } from '../../../styled-system/recipes/panel';
import { progress } from '../../../styled-system/recipes/progress';

type PlanningLogProps = {
  request: PlanRequest;
  result: PlanResult;
  phaseIndex: number;
};

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
  p: '5',
  maxHeight: { base: 'plan-log-sm', lg: 'plan-log-lg' },
  overflowY: 'auto',
  fontFamily: 'mono',
  fontSize: 'caption',
  lineHeight: '1.65',
});

const lineClass = css({
  display: 'grid',
  gridTemplateColumns: '{spacing.6} 1fr',
  gap: '2',
  color: 'cream.500',
  '&[data-active=true]': {
    color: 'peach.300',
  },
  '&[data-done=true]': {
    color: 'lime.300',
  },
});

const detailClass = css({
  gridColumn: '2',
  color: 'cream.700',
});

export default function PlanningLog({
  request,
  result,
  phaseIndex,
}: PlanningLogProps) {
  const pct = Math.round(((phaseIndex + 1) / result.phases.length) * 100);
  const progressClasses = progress({ size: 'terminal' });
  const lines = [
    { token: '→', message: 'boot :: ev-agent/0.4.2 · session 9f2c' },
    { token: '.', message: `origin :: ${cleanPlanAddress(request.from.full)}` },
    { token: '.', message: `target :: ${cleanPlanAddress(request.to.full)}` },
    ...request.activities.map((activity) => ({
      token: '.',
      message: `want :: ${activity.id} · ${activity.dwellMinutes}m`,
    })),
  ];

  return (
    <Box className={panel({ variant: 'terminal' })}>
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
        {lines.map((line) => (
          <Box key={`${line.token}-${line.message}`} className={lineClass}>
            <span>{line.token}</span>
            <span>{line.message}</span>
          </Box>
        ))}
        {result.phases.map((phase, index) => {
          const active = index === phaseIndex;
          const done = index < phaseIndex;
          if (index > phaseIndex) return null;
          return (
            <Box
              key={phase.label}
              className={lineClass}
              data-active={active}
              data-done={done}
            >
              <span>{done ? '✓' : '▸'}</span>
              <span>{phase.label}</span>
              <Box className={detailClass}>{phase.detail}</Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
