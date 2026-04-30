import { BatteryCharging, Flag, MapPin, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Icon from '#/components/Icon';
import type { PlanStop } from '#/features/plan/contracts';
import { formatPlanMinutes } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';

type StopTimelineProps = {
  stops: PlanStop[];
  selectedStopId?: string | null;
  onSelectStop?: (id: string) => void;
};

const listClass = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
});

const stopClass = css({
  width: 'full',
  display: 'block',
  px: '4',
  py: '2.5',
  textAlign: 'left',
  color: 'cream.200',
  opacity: 0.78,
  transition: 'opacity 0.2s ease, background 0.2s ease, transform 0.2s ease',
  '& > span': {
    width: 'full',
    display: 'block',
  },
  '& > span > span:not([data-part])': {
    width: 'full',
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr)',
    gap: '3',
    alignItems: 'stretch',
  },
  '& [data-part=leading-icon], & [data-part=trailing-icon]': {
    display: 'none',
  },
  _hover: {
    opacity: 1,
    background: 'rgba(255, 149, 102, 0.04)',
    transform: 'translateX(2px)',
  },
  '&[data-selected=true]': {
    opacity: 1,
    background: 'rgba(255, 149, 102, 0.08)',
  },
});

const iconClass = css({
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  justifySelf: 'center',
  mt: '1',
  borderRadius: 'full',
  borderWidth: '2px',
  borderColor: 'var(--stop-color)',
  color: 'var(--stop-color)',
  background: 'rgba(15, 10, 36, 0.72)',
  boxShadow: '0 0 18px color-mix(in srgb, var(--stop-color) 30%, transparent)',
});

const stopBodyClass = css({
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream.08',
  minWidth: 0,
  pb: '2.5',
});

const topRowClass = css({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '3',
  minWidth: 0,
});

const nameClass = css({
  fontSize: '14px',
  fontWeight: '700',
  color: 'cream.100',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const timeClass = css({
  textStyle: 'mono-meta',
  fontSize: '10px',
  color: 'peach.300',
  letterSpacing: '0.14em',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

const subClass = css({
  mt: '1',
  fontSize: '12px',
  lineHeight: '1.35',
  color: 'cream.600',
});

const metaClass = css({
  mt: '2',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  textStyle: 'mono-meta',
  fontSize: '9px',
  color: 'cream.700',
  letterSpacing: '0.12em',
  '& span': {
    whiteSpace: 'nowrap',
  },
});

export default function StopTimeline({
  stops,
  selectedStopId,
  onSelectStop,
}: StopTimelineProps) {
  return (
    <Stack className={listClass}>
      {stops.map((stop) => {
        const StopIcon =
          stop.kind === 'charge'
            ? BatteryCharging
            : stop.kind === 'end'
              ? Flag
              : stop.kind === 'activity'
                ? Sparkles
                : MapPin;
        return (
          <Button
            key={stop.id}
            type="button"
            unstyled
            className={stopClass}
            data-selected={selectedStopId === stop.id}
            style={{ '--stop-color': stop.color ?? '#ff9566' } as CSSProperties}
            onClick={() => onSelectStop?.(stop.id)}
          >
            <Box className={iconClass}>
              <Icon icon={StopIcon} size="sm" />
            </Box>
            <Box className={stopBodyClass}>
              <Box className={topRowClass}>
                <Box className={nameClass}>{stop.name}</Box>
                <Box className={timeClass}>{stop.arrivalTime}</Box>
              </Box>
              {stop.sub ? <Box className={subClass}>{stop.sub}</Box> : null}
              <Box className={metaClass}>
                {stop.miles > 0 ? <span>{stop.miles} MI</span> : null}
                {stop.driveMinutes > 0 ? (
                  <span>{formatPlanMinutes(stop.driveMinutes)} DRIVE</span>
                ) : null}
                {stop.dwellMinutes > 0 ? (
                  <span>{formatPlanMinutes(stop.dwellMinutes)} STOP</span>
                ) : null}
              </Box>
            </Box>
          </Button>
        );
      })}
    </Stack>
  );
}
