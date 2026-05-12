import {
  BatteryCharging,
  Flag,
  type LucideIcon,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import { formatPlanMinutes } from '#/features/plan/utils/helpers';
import { buildStopTimelineItems } from '#/features/plan/utils/timelineItems';
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

const groupRowClass = css({
  display: 'grid',
  gridTemplateColumns: '40px minmax(0, 1fr)',
  alignItems: 'stretch',
  gap: '3',
  paddingX: '4',
  paddingY: '2.5',
  position: 'relative',
  opacity: 0.9,
  transition:
    'opacity {durations.fast} {easings.ease-out}, background {durations.fast} {easings.ease-out}',
  '&[data-selected=true]': {
    opacity: 1,
    background: 'alpha.peach-08',
  },
});

const groupBodyClass = css({
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream-06',
  paddingBottom: '2.5',
});

const groupShellClass = css({
  borderWidth: '1px',
  borderColor: 'alpha.cream-12',
  background: 'alpha.night-48',
  overflow: 'hidden',
  '&[data-selected=true]': {
    borderColor: 'alpha.peach-24',
    background: 'alpha.peach-06',
  },
});

const groupHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  minWidth: 0,
  px: '3',
  py: '2.5',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream-06',
});

const groupTitleClass = css({
  minWidth: 0,
  color: 'cream.100',
  fontFamily: 'display',
  fontSize: 'md',
  fontWeight: '600',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const groupBadgeClass = css({
  flexShrink: 0,
  fontFamily: 'mono',
  fontSize: 'micro',
  lineHeight: '1',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'peach.400',
});

const groupStopButtonClass = css({
  width: 'full',
  display: 'grid',
  gridTemplateColumns: '28px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '2.5',
  px: '3',
  py: '2.5',
  background: 'transparent',
  border: 'none',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream-06',
  color: 'cream.200',
  cursor: 'pointer',
  textAlign: 'left',
  transition:
    'background {durations.fast} {easings.ease-out}, opacity {durations.fast} {easings.ease-out}',
  _last: {
    borderBottomWidth: '0',
  },
  _hover: {
    background: 'alpha.peach-06',
  },
  '&[aria-pressed=true]': {
    background: 'alpha.peach-10',
  },
});

const groupStopIconClass = css({
  width: '24px',
  height: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'full',
  color: 'var(--stop-color)',
  background: 'alpha.cream-06',
});

const groupStopBodyClass = css({
  minWidth: 0,
});

const groupStopNameClass = css({
  color: 'cream.100',
  fontSize: 'ui',
  fontWeight: '600',
  lineHeight: '1.2',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const groupStopMetaClass = css({
  mt: '0.5',
  fontSize: 'caption',
  lineHeight: '1.35',
  color: 'cream.600',
});

const durationPillClass = css({
  minWidth: '54px',
  px: '2',
  py: '1.5',
  textAlign: 'center',
  fontFamily: 'mono',
  fontSize: '2xs',
  fontWeight: 'medium',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'cream.100',
  background: 'alpha.cream-08',
});

const groupNoteClass = css({
  marginTop: '1.5',
  paddingTop: '1.5',
  borderTopWidth: '1px',
  borderTopStyle: 'dashed',
  borderTopColor: 'alpha.cream-12',
  fontFamily: 'mono',
  fontSize: 'micro',
  lineHeight: '1.3',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'cream.600',
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

function isStopSelected(stop: PlanStop, selectedStopId?: string | null) {
  return selectedStopId === stop.id;
}

function getGroupColor(charge: PlanStop, activity: PlanStop) {
  return charge.color ?? activity.color ?? 'var(--colors-peach-400)';
}

function ChargeActivityGroup({
  charge,
  activity,
  firstStop,
  selectedStopId,
  onSelect,
}: {
  charge: PlanStop;
  activity: PlanStop;
  firstStop: PlanStop;
  selectedStopId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const groupSelected = [charge, activity].some((stop) =>
    isStopSelected(stop, selectedStopId),
  );
  const driveNote = driveNoteForStop(firstStop);

  return (
    <Box
      className={groupRowClass}
      data-selected={groupSelected}
      style={
        {
          '--stop-color': getGroupColor(charge, activity),
        } as CSSProperties
      }
    >
      <Box className={timelineClasses.icon}>
        <Icon
          icon={BatteryCharging}
          size="sm"
          strokeWidth={1.75}
          className={timelineIconClass}
        />
      </Box>
      <Box className={groupBodyClass}>
        <ChargeActivityShell charge={charge} selected={groupSelected}>
          <GroupedStopButton
            stop={charge}
            label="Charging"
            selected={isStopSelected(charge, selectedStopId)}
            onSelect={onSelect}
          />
          <GroupedStopButton
            stop={activity}
            label="Activity"
            selected={isStopSelected(activity, selectedStopId)}
            onSelect={onSelect}
          />
        </ChargeActivityShell>
        {driveNote ? <Box className={groupNoteClass}>{driveNote}</Box> : null}
      </Box>
    </Box>
  );
}

function ChargeActivityShell({
  charge,
  selected,
  children,
}: {
  charge: PlanStop;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <Box className={groupShellClass} data-selected={selected}>
      <Box className={groupHeaderClass}>
        <Box className={groupTitleClass}>{charge.name}</Box>
        <Box className={groupBadgeClass}>Charging stop</Box>
      </Box>
      {children}
    </Box>
  );
}

function GroupedStopButton({
  stop,
  label,
  selected,
  onSelect,
}: {
  stop: PlanStop;
  label: string;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const StopIcon = pickStopIcon(stop.kind);
  const detail = getGroupedStopDetail(stop);

  return (
    <Button
      type="button"
      unstyled
      contentMode="custom"
      className={groupStopButtonClass}
      aria-pressed={selected}
      style={
        {
          '--stop-color': stop.color ?? 'var(--colors-peach-400)',
        } as CSSProperties
      }
      onClick={() => onSelect?.(stop.id)}
    >
      <Box className={groupStopIconClass}>
        <Icon
          icon={StopIcon}
          size="sm"
          strokeWidth={1.75}
          className={timelineIconClass}
        />
      </Box>
      <Box className={groupStopBodyClass}>
        <Box className={groupStopNameClass}>{label}</Box>
        <Box className={groupStopMetaClass}>{stop.name}</Box>
        <Box className={groupStopMetaClass}>{detail}</Box>
      </Box>
      <Box className={durationPillClass}>
        {formatPlanMinutes(stop.dwellMinutes)}
      </Box>
    </Button>
  );
}

function getGroupedStopDetail(stop: PlanStop) {
  if (stop.kind === 'charge') return stop.detail ?? 'Fast charge';
  return stop.detail ?? stop.kind;
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
  const items = buildStopTimelineItems(stops);

  return (
    <Stack className={listClass}>
      {items.map((item) =>
        item.type === 'chargeActivity' ? (
          <ChargeActivityGroup
            key={item.id}
            charge={item.charge}
            activity={item.activity}
            firstStop={item.firstStop}
            selectedStopId={selectedStopId}
            onSelect={onSelectStop}
          />
        ) : (
          <StopRow
            key={item.id}
            stop={item.stop}
            selected={selectedStopId === item.stop.id}
            onSelect={onSelectStop}
          />
        ),
      )}
    </Stack>
  );
}

function getStopMeta(stop: PlanStop) {
  return stopMetaFormatters[stop.kind](stop);
}

const stopMetaFormatters = {
  start: (stop: PlanStop) => `Depart · ${stop.arrivalTime}`,
  end: (stop: PlanStop) => `Arrive · ${stop.arrivalTime}`,
  charge: (stop: PlanStop) =>
    `${formatPlanMinutes(stop.dwellMinutes)} · ${stop.detail ?? 'Fast charge'}`,
  activity: (stop: PlanStop) =>
    `${formatPlanMinutes(stop.dwellMinutes)} · ${stop.detail ?? stop.kind}`,
} satisfies Record<PlanStop['kind'], (stop: PlanStop) => string>;
