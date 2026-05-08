import type { CSSProperties } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import CarSilhouette from '#/features/dashboard/components/CarSilhouette';
import CarStat from '#/features/dashboard/components/CarStat';
import type { DashboardTeslaSummary } from '#/features/dashboard/types/contracts';
import { cx } from '#/styled-system/css';
import { chip } from '#/styled-system/recipes/chip';
import { dashboard } from '#/styled-system/recipes/dashboard';
import { panel } from '#/styled-system/recipes/panel';

const BATTERY_SEGMENTS = Array.from(
  { length: 10 },
  (_, index) => `segment-${index}`,
);

function teslaTelemetryGapHint(tesla: DashboardTeslaSummary): string | null {
  if (tesla.status !== 'linked' && tesla.status !== 'offline') return null;
  if (!tesla.vehicle) return null;
  const hasCharge =
    tesla.vehicle.batteryLevel != null || tesla.vehicle.rangeMi != null;
  if (hasCharge) return null;
  if (tesla.vehicle.state?.toLowerCase() === 'asleep') {
    return 'Battery % and estimated range need the car to wake and report to Tesla.';
  }
  return 'Battery % and range stay blank until Tesla returns charge data for this vehicle.';
}

type CarStatusPanelProps = {
  tesla: DashboardTeslaSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  onConnect: () => void;
  onRerunSetup: () => void;
};

type ActionMode = 'connect' | 'refresh' | 'checking';

const REFRESHABLE_STATUSES = new Set<DashboardTeslaSummary['status']>([
  'linked',
  'offline',
  'error',
  'pending',
]);

function pickActionMode(tesla: DashboardTeslaSummary): ActionMode {
  if (tesla.status === 'unlinked') return 'connect';
  if (tesla.linked && REFRESHABLE_STATUSES.has(tesla.status)) return 'refresh';
  return 'checking';
}

function PrimaryAction({
  mode,
  isRefreshing,
  onConnect,
  onRefresh,
}: {
  mode: ActionMode;
  isRefreshing: boolean;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  if (mode === 'connect') {
    return (
      <Button variant="primary" size="sm" onClick={onConnect}>
        Connect Tesla
      </Button>
    );
  }
  if (mode === 'refresh') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={onRefresh}
        loading={isRefreshing}
        loadingText="Refreshing"
      >
        Refresh
      </Button>
    );
  }
  return (
    <Button variant="primary" size="sm" disabled>
      Checking…
    </Button>
  );
}

export default function CarStatusPanel({
  tesla,
  isRefreshing,
  onRefresh,
  onConnect,
  onRerunSetup,
}: CarStatusPanelProps) {
  const slots = dashboard();
  const displayBattery = tesla.vehicle?.batteryLevel;
  const batteryFillPct =
    displayBattery == null ? 0 : Math.max(6, displayBattery);
  const range = tesla.vehicle?.rangeMi;
  const odometer = tesla.vehicle?.odometerMi;
  const carName = tesla.vehicle?.displayName ?? 'Tesla integration';
  const telemetryHint = teslaTelemetryGapHint(tesla);
  const actionMode = pickActionMode(tesla);

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
              ? 'Battery level not available'
              : `Battery ${displayBattery}%`
          }
        >
          <Box
            className={slots.batteryFill}
            style={{ '--battery': `${batteryFillPct}%` } as CSSProperties}
          />
          <Box className={slots.batterySegments} aria-hidden="true">
            {BATTERY_SEGMENTS.map((segment) => (
              <span key={segment} />
            ))}
          </Box>
        </Box>
        <Box className={slots.batteryPct}>
          {displayBattery == null ? '--' : displayBattery}
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

      {telemetryHint ? (
        <Box
          mt="2"
          fontSize="xs"
          lineHeight="1.45"
          color="cream.600"
          fontWeight="medium"
        >
          {telemetryHint}
        </Box>
      ) : null}

      <Box className={slots.disabledActionRow}>
        <button className={slots.disabledAction} type="button" disabled>
          Precondition soon
        </button>
        <button className={slots.disabledAction} type="button" disabled>
          Unlock soon
        </button>
      </Box>

      <Box className={slots.disabledActionRow}>
        <PrimaryAction
          mode={actionMode}
          isRefreshing={isRefreshing}
          onConnect={onConnect}
          onRefresh={onRefresh}
        />
        <Button variant="ghost" size="sm" onClick={onRerunSetup}>
          Re-run setup
        </Button>
      </Box>

      <Box className={slots.carSvgWrap}>
        <CarSilhouette battery={displayBattery ?? 0} />
      </Box>
    </Box>
  );
}
