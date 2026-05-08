import {
  BatteryCharging,
  Flag,
  type LucideIcon,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import { formatPlanMinutes } from '#/features/plan/utils/helpers';
import type { PlanStop } from '#/shared/plan/contracts';
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

const STOP_ICONS = {
  charge: BatteryCharging,
  end: Flag,
  activity: Sparkles,
  start: MapPin,
} as const;

function pickStopIcon(kind: PlanStop['kind']): LucideIcon {
  return STOP_ICONS[kind as keyof typeof STOP_ICONS] ?? MapPin;
}

function driveNoteForStop(stop: PlanStop): string | null {
  if (stop.driveMinutes <= 0) return null;
  return `${formatPlanMinutes(stop.driveMinutes)} · ${stop.miles} mi from prev`;
}

function StopRow({
  stop,
  selected,
  onSelect,
}: {
  stop: PlanStop;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const StopIcon = pickStopIcon(stop.kind);
  const driveNote = driveNoteForStop(stop);
  return (
    <Button
      type="button"
      unstyled
      contentMode="custom"
      className={timelineClasses.row}
      aria-pressed={selected}
      style={
        {
          '--stop-color': stop.color ?? 'var(--colors-peach-400)',
        } as CSSProperties
      }
      onClick={() => onSelect?.(stop.id)}
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
        <Box className={timelineClasses.meta}>{getStopMeta(stop)}</Box>
        {stop.sub ? (
          <Box className={timelineClasses.secondary}>{stop.sub}</Box>
        ) : null}
        {driveNote ? (
          <Box className={timelineClasses.note}>{driveNote}</Box>
        ) : null}
      </Box>
    </Button>
  );
}

export default function StopTimeline({
  stops,
  selectedStopId,
  onSelectStop,
}: StopTimelineProps) {
  return (
    <Stack className={listClass}>
      {stops.map((stop) => (
        <StopRow
          key={stop.id}
          stop={stop}
          selected={selectedStopId === stop.id}
          onSelect={onSelectStop}
        />
      ))}
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
