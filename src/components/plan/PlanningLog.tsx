import { Box, Stack } from 'styled-system/jsx';
import type { PlanRequest, PlanResult } from '#/features/plan/contracts';
import { cleanPlanAddress } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';

type PlanningLogProps = {
  request: PlanRequest;
  result: PlanResult;
  phaseIndex: number;
};

const terminalClass = css({
  height: 'full',
  minHeight: '280px',
  borderRadius: '24px',
  borderWidth: '1px',
  borderColor: 'alpha.cream.18',
  background: 'rgba(15, 10, 36, 0.78)',
  boxShadow: '0 24px 80px -35px rgba(0, 0, 0, 0.8)',
  overflow: 'hidden',
  backdropFilter: 'blur(16px)',
});

const headerClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '5',
  py: '4',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream.10',
  textStyle: 'mono-meta',
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: 'cream.600',
});

const progressClass = css({
  height: '3px',
  background: 'alpha.cream.08',
});

const progressFillClass = css({
  height: 'full',
  background:
    'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
  transition: 'width 0.35s ease',
});

const bodyClass = css({
  p: '5',
  maxHeight: { base: '320px', lg: '520px' },
  overflowY: 'auto',
  fontFamily: 'mono',
  fontSize: '12px',
  lineHeight: '1.65',
});

const lineClass = css({
  display: 'grid',
  gridTemplateColumns: '24px 1fr',
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
    <Box className={terminalClass}>
      <Box className={headerClass}>
        <span>AGENT · PLANNING</span>
        <span>{pct}%</span>
      </Box>
      <Box className={progressClass}>
        <Box className={progressFillClass} style={{ width: `${pct}%` }} />
      </Box>
      <Stack className={bodyClass} gap="1">
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
