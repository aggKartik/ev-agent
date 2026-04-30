import { BatteryCharging, Clock, MapPinned, Route } from 'lucide-react';
import { Box, Flex, Grid, Stack } from 'styled-system/jsx';
import Icon from '#/components/Icon';
import { Text } from '#/components/Text';
import type { PlanResult } from '#/features/plan/contracts';
import { cleanPlanAddress, formatPlanMinutes } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';
import StopTimeline from './StopTimeline';

type ItineraryDrawerProps = {
  result: PlanResult;
  selectedStopId?: string | null;
  onSelectStop: (id: string) => void;
};

const drawerClass = css({
  width: 'full',
  height: { base: 'auto', lg: 'full' },
  maxHeight: { base: 'none', lg: 'full' },
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '18px',
  borderWidth: '1px',
  borderColor: 'alpha.cream.18',
  background: 'rgba(15, 10, 36, 0.88)',
  boxShadow: '0 24px 80px -35px rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(18px)',
});

const headerClass = css({
  px: '4',
  py: '3.5',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream.10',
  flexShrink: 0,
});

const kickerClass = css({
  textStyle: 'mono-meta',
  fontSize: '10px',
  color: 'lime.300',
  letterSpacing: '0.18em',
  mb: '2',
});

const titleClass = css({
  fontFamily: 'display',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.1',
  color: 'cream.100',
});

const subClass = css({
  mt: '2',
  color: 'cream.600',
  fontSize: '13px',
  lineHeight: '1.4',
});

const statsClass = css({
  p: '0',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream.10',
  flexShrink: 0,
});

const statCardClass = css({
  minWidth: 0,
  borderRightWidth: '1px',
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
  fontSize: '9px',
  color: 'cream.700',
  letterSpacing: '0.14em',
});

const statValueClass = css({
  mt: '1',
  fontFamily: 'display',
  fontSize: '20px',
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
    <Box className={drawerClass}>
      <Box className={headerClass}>
        <Box className={kickerClass}>ITINERARY · READY</Box>
        <Text as="h2" className={titleClass}>
          {cleanPlanAddress(result.request.from.full)} to{' '}
          {cleanPlanAddress(result.request.to.full)}
        </Text>
        <Text className={subClass}>
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
