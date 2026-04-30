import { BatteryCharging, Clock, MapPinned, Route } from 'lucide-react';
import { Box, Flex, Grid, Stack } from 'styled-system/jsx';
import Icon from '#/components/Icon';
import { Text } from '#/components/Text';
import type { PlanResult } from '#/features/plan/contracts';
import { cleanPlanAddress, formatPlanMinutes } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';
import { panel } from '../../../styled-system/recipes/panel';
import { sectionHeader } from '../../../styled-system/recipes/section-header';
import StopTimeline from './StopTimeline';

type ItineraryDrawerProps = {
  result: PlanResult;
  selectedStopId?: string | null;
  onSelectStop: (id: string) => void;
};

const drawerHeaderClasses = sectionHeader({ tone: 'drawer' });

const headerClass = css({
  px: '4',
  py: '3.5',
  borderBottomWidth: 'hair',
  borderBottomColor: 'alpha.cream.10',
  flexShrink: 0,
});

const statsClass = css({
  p: '0',
  borderBottomWidth: 'hair',
  borderBottomColor: 'alpha.cream.10',
  flexShrink: 0,
});

const statCardClass = css({
  minWidth: 0,
  borderRightWidth: 'hair',
  borderRightColor: 'alpha.cream.10',
  background: 'transparent',
  px: '2.5',
  py: '3.5',
  _last: {
    borderRightWidth: '0',
  },
});

const statLabelClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  textStyle: 'mono-meta',
  fontSize: 'micro',
  color: 'cream.700',
  letterSpacing: '0.14em',
});

const statValueClass = css({
  mt: '1',
  fontFamily: 'display',
  fontSize: 'display-sm',
  fontWeight: '700',
  color: 'cream.100',
});

const timelineWrapClass = css({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  py: '2.5',
});

export default function ItineraryDrawer({
  result,
  selectedStopId,
  onSelectStop,
}: ItineraryDrawerProps) {
  const { totals } = result;

  return (
    <Box className={panel({ variant: 'drawer' })}>
      <Box className={headerClass}>
        <Box className={drawerHeaderClasses.kicker}>ITINERARY · READY</Box>
        <Text as="h2" className={drawerHeaderClasses.title}>
          {cleanPlanAddress(result.request.from.full)} to{' '}
          {cleanPlanAddress(result.request.to.full)}
        </Text>
        <Text className={drawerHeaderClasses.desc}>
          Built around {totals.activityStops} vibe stops and{' '}
          {totals.chargeStops} fast charge
          {totals.chargeStops === 1 ? '' : 's'}, arriving around{' '}
          {totals.arrivalTime}.
        </Text>
      </Box>

      <Grid
        className={statsClass}
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
        gap="0"
      >
        <Stat icon={Route} label="Miles" value={`${totals.miles}`} />
        <Stat
          icon={Clock}
          label="Drive"
          value={formatPlanMinutes(totals.driveMinutes)}
        />
        <Stat
          icon={BatteryCharging}
          label="Charge"
          value={`${totals.chargeStops}`}
        />
        <Stat icon={MapPinned} label="Stops" value={`${result.stops.length}`} />
      </Grid>

      <Box className={timelineWrapClass}>
        <StopTimeline
          stops={result.stops}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
        />
      </Box>
    </Box>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['icon'];
  label: string;
  value: string;
}) {
  return (
    <Stack className={statCardClass}>
      <Flex className={statLabelClass}>
        <Icon icon={icon} size="xs" />
        {label}
      </Flex>
      <Box className={statValueClass}>{value}</Box>
    </Stack>
  );
}
