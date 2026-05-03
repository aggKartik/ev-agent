import { ArrowRight } from 'lucide-react';
import { Box, Grid, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { formatPlanMinutes } from '#/features/plan/utils/helpers';
import type { PlanResult } from '#/shared/plan/contracts';
import { css, cx } from '#/styled-system/css';
import { panel } from '#/styled-system/recipes/panel';
import StopTimeline from './StopTimeline';

type ItineraryDrawerProps = {
  result: PlanResult;
  selectedStopId?: string | null;
  onSelectStop: (id: string) => void;
  onStartNavigation?: () => void;
};

const rootClass = css({
  '@media (min-width: 1024px)': {
    mt: '76px',
    height: 'calc(100% - 76px)',
    maxHeight: 'calc(100% - 76px)',
  },
});

const drawerHandleClass = css({
  px: '4',
  py: '3.5',
  borderBottomWidth: 'hair',
  borderBottomColor: 'alpha.cream-12',
  flexShrink: 0,
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'widest',
  textTransform: 'uppercase',
  color: 'peach.400',
});

const statsClass = css({
  p: '0',
  borderBottomWidth: 'hair',
  borderBottomColor: 'alpha.cream-12',
  flexShrink: 0,
});

const statCardClass = css({
  minWidth: 0,
  borderRightWidth: 'hair',
  borderRightColor: 'alpha.cream-12',
  background: 'transparent',
  px: '2.5',
  py: '3.5',
  textAlign: 'center',
  _last: {
    borderRightWidth: '0',
  },
});

const statLabelClass = css({
  fontFamily: 'mono',
  fontWeight: 'medium',
  fontSize: 'micro',
  lineHeight: 'close',
  color: 'cream.600',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  marginTop: '0.5',
});

const statValueClass = css({
  fontFamily: 'display',
  fontSize: 'xl',
  fontWeight: '700',
  color: 'cream.100',
  letterSpacing: '-0.02em',
  lineHeight: '1',
});

const timelineWrapClass = css({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  py: '2.5',
});

const ctaClass = css({
  flexShrink: 0,
  px: '4',
  py: '3.5',
  borderTopWidth: 'hair',
  borderTopColor: 'alpha.cream-12',
});

const ctaButtonClass = css({
  width: 'full',
  justifyContent: 'center',
  fontSize: 'ui',
  fontWeight: 'semibold',
  gap: '2.5',
});

const ctaSubClass = css({
  mt: '2',
  fontFamily: 'mono',
  fontSize: '2xs',
  lineHeight: 'close',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textAlign: 'center',
  color: 'cream.600',
});

export default function ItineraryDrawer({
  result,
  selectedStopId,
  onSelectStop,
  onStartNavigation,
}: ItineraryDrawerProps) {
  const { totals } = result;
  const totalDuration = totals.driveMinutes + totals.dwellMinutes;
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const totalHours =
    totalDuration >= 60
      ? mins === 0
        ? `${hours}h`
        : `${hours}h ${mins}m`
      : formatPlanMinutes(totalDuration);

  return (
    <Box className={cx(panel({ variant: 'drawer' }), rootClass)}>
      <Box className={drawerHandleClass}>ITINERARY</Box>

      <Grid
        className={statsClass}
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
        gap="0"
      >
        <Stat label="Total" value={totalHours} />
        <Stat label="Miles" value={`${totals.miles}`} />
        <Stat label="Charges" value={`${totals.chargeStops}`} />
        <Stat label="Stops" value={`${totals.activityStops}`} />
      </Grid>

      <Box className={timelineWrapClass}>
        <StopTimeline
          stops={result.stops}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
        />
      </Box>

      <Box className={ctaClass}>
        <Button
          type="button"
          className={ctaButtonClass}
          trailingIcon={<ArrowRight size={16} />}
          onClick={onStartNavigation}
          disabled={!onStartNavigation}
        >
          Start navigation
        </Button>
        <Box className={ctaSubClass}>
          We&apos;ll sync to your car and start routing.
        </Box>
      </Box>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack className={statCardClass}>
      <Box className={statValueClass}>{value}</Box>
      <Box className={statLabelClass}>{label}</Box>
    </Stack>
  );
}
