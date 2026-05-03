import { BatteryCharging, Flag, MapPin, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import type { PlanStop } from '#/features/plan/types/contracts';
import { formatPlanMinutes } from '#/features/plan/utils/helpers';
import { css } from '#/styled-system/css';
import { selectableRow } from '#/styled-system/recipes/selectable-row';

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

const timelineClasses = selectableRow({ variant: 'timeline' });

const timelineIconClass = css({
  width: '14px',
  height: '14px',
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
        const stopMeta = getStopMeta(stop);
        const driveNote =
          stop.driveMinutes > 0
            ? `${formatPlanMinutes(stop.driveMinutes)} · ${stop.miles} mi from prev`
            : null;
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
              <Icon
                icon={StopIcon}
                size="sm"
                strokeWidth={1.75}
                className={timelineIconClass}
              />
            </Box>
            <Box className={timelineClasses.body}>
              <Box className={timelineClasses.primary}>{stop.name}</Box>
              <Box className={timelineClasses.meta}>{stopMeta}</Box>
              {stop.sub ? (
                <Box className={timelineClasses.secondary}>{stop.sub}</Box>
              ) : null}
              {driveNote ? (
                <Box className={timelineClasses.note}>{driveNote}</Box>
              ) : null}
            </Box>
          </Button>
        );
      })}
    </Stack>
  );
}

function getStopMeta(stop: PlanStop) {
  if (stop.kind === 'start') return `Depart · ${stop.arrivalTime}`;
  if (stop.kind === 'end') return `Arrive · ${stop.arrivalTime}`;
  if (stop.kind === 'charge') {
    return `${formatPlanMinutes(stop.dwellMinutes)} · ${stop.detail ?? 'Fast charge'}`;
  }
  return `${formatPlanMinutes(stop.dwellMinutes)} · ${stop.detail ?? stop.kind}`;
}
