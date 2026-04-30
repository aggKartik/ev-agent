import { BatteryCharging, Flag, MapPin, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Icon from '#/components/Icon';
import type { PlanStop } from '#/features/plan/contracts';
import { formatPlanMinutes } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';
import { selectableRow } from '../../../styled-system/recipes/selectable-row';

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

const topRowClass = css({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '3',
  minWidth: 0,
});

const timeClass = css({
  textStyle: 'mono-meta',
  fontSize: '2xs',
  color: 'peach.300',
  letterSpacing: '0.14em',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

const timelineClasses = selectableRow({ variant: 'timeline' });

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
            contentMode="custom"
            className={timelineClasses.row}
            aria-pressed={selectedStopId === stop.id}
            style={
              {
                '--stop-color': stop.color ?? 'var(--colors-peach-400)',
              } as CSSProperties
            }
            onClick={() => onSelectStop?.(stop.id)}
          >
            <Box className={timelineClasses.icon}>
              <Icon icon={StopIcon} size="sm" />
            </Box>
            <Box className={timelineClasses.body}>
              <Box className={topRowClass}>
                <Box className={timelineClasses.primary}>{stop.name}</Box>
                <Box className={timeClass}>{stop.arrivalTime}</Box>
              </Box>
              {stop.sub ? (
                <Box className={timelineClasses.secondary}>{stop.sub}</Box>
              ) : null}
              <Box className={timelineClasses.meta}>
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
