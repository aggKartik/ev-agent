import type { CSSProperties } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import CarSilhouette from '#/features/dashboard/components/CarSilhouette';
import CarStat from '#/features/dashboard/components/CarStat';
import type { DashboardTeslaSummary } from '#/features/dashboard/contracts';
import { cx } from '#/styled-system/css';
import { chip } from '#/styled-system/recipes/chip';
import { dashboard } from '#/styled-system/recipes/dashboard';
import { panel } from '#/styled-system/recipes/panel';

const BATTERY_SEGMENTS = Array.from(
  { length: 10 },
  (_, index) => `segment-${index}`,
);

type CarStatusPanelProps = {
  tesla: DashboardTeslaSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  onConnect: () => void;
};

export default function CarStatusPanel({
  tesla,
  isRefreshing,
  onRefresh,
  onConnect,
}: CarStatusPanelProps) {
  const slots = dashboard();
  const battery = tesla.vehicle?.batteryLevel ?? 0;
  const displayBattery = tesla.vehicle?.batteryLevel;
  const range = tesla.vehicle?.rangeMi;
  const odometer = tesla.vehicle?.odometerMi;
  const carName = tesla.vehicle?.displayName ?? 'Tesla integration';
  const shouldConnect = tesla.status === 'unlinked';

  return (
    <Box className={cx(panel({ variant: 'glass-feature' }), slots.carPanel)}>
      <Box className={slots.carHead}>
        <Box as="span" className={slots.kicker}>
          Your car
        </Box>
        <Box as="span" className={chip({ tone: 'live' })}>
          {tesla.label}
        </Box>
      </Box>

      <Box className={slots.carName}>{carName}</Box>
      <Box className={slots.carDetail}>{tesla.detail}</Box>

      <Box display="flex" alignItems="center" gap="3.5" position="relative">
        <Box
          className={slots.battery}
          aria-label={
            displayBattery == null
              ? 'Battery unavailable'
              : `Battery ${displayBattery}%`
          }
        >
          <Box
            className={slots.batteryFill}
            style={{ '--battery': `${Math.max(6, battery)}%` } as CSSProperties}
          />
          <Box className={slots.batterySegments} aria-hidden="true">
            {BATTERY_SEGMENTS.map((segment) => (
              <span key={segment} />
            ))}
          </Box>
        </Box>
        <Box className={slots.batteryPct}>
          {displayBattery ?? '--'}
          <small>%</small>
        </Box>
      </Box>

      <Box className={slots.carStats}>
        <CarStat
          label="Range"
          value={range == null ? '--' : Math.round(range)}
          unit="mi"
        />
        <CarStat
          label="Odometer"
          value={
            odometer == null ? '--' : Math.round(odometer).toLocaleString()
          }
          unit="mi"
        />
        <CarStat
          label="State"
          value={
            tesla.vehicle?.state?.toUpperCase() ?? tesla.status.toUpperCase()
          }
        />
      </Box>

      <Box className={slots.disabledActionRow}>
        <button className={slots.disabledAction} type="button" disabled>
          Precondition soon
        </button>
        <button className={slots.disabledAction} type="button" disabled>
          Unlock soon
        </button>
      </Box>

      <Box className={slots.disabledActionRow}>
        {shouldConnect ? (
          <Button variant="primary" size="sm" onClick={onConnect}>
            Connect Tesla
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onRefresh}
            loading={isRefreshing}
            loadingText="Refreshing"
          >
            Refresh
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled>
          Read-only
        </Button>
      </Box>

      <Box className={slots.carSvgWrap}>
        <CarSilhouette battery={battery} />
      </Box>
    </Box>
  );
}
