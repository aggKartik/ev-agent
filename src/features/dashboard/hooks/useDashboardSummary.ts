import { useMemo } from 'react';
import type { DashboardSummary } from '#/features/dashboard/types/contracts';
import { DASHBOARD_FALLBACK_TESLA } from '#/features/dashboard/utils/data';
import {
  buildDashboardSummary,
  buildErroredTeslaSummary,
  buildLinkedTeslaSummary,
  buildPendingTeslaSummary,
  teslaVehicleSummaryToDashboard,
} from '#/features/dashboard/utils/helpers';
import { trpc } from '#/lib/trpc';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';

/**
 * Composes the dashboard read model from three live sources: the **Driver**
 * profile (Clerk-backed), the Tesla OAuth status, and — when linked — the
 * cached Tesla telemetry. Every block degrades gracefully so the page
 * always renders, even mid-fetch or with Tesla unlinked.
 *
 * Single hook = single concern (dashboard data composition); side effects
 * stay in tRPC's own caching layer.
 */
export function useDashboardSummary(): {
  summary: DashboardSummary;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
} {
  const utils = trpc.useUtils();

  const profileQuery = trpc.user.profile.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  const teslaStatus = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 60_000 },
  );

  const teslaLinked = teslaStatus.data?.linked === true;

  const teslaVehicles = trpc.tesla.vehicles.useQuery(undefined, {
    enabled: teslaLinked,
    staleTime: 60_000,
  });

  const vehicleQuery = trpc.vehicle.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  const summary = useMemo<DashboardSummary>(() => {
    const firstName = profileQuery.data?.firstName ?? null;
    const profileVehicle = vehicleQuery.data?.profile?.identity ?? null;

    if (teslaStatus.isPending) {
      return buildDashboardSummary({
        firstName,
        tesla: buildPendingTeslaSummary({
          linked: false,
          label: 'Checking',
          detail: 'Checking whether Tesla is connected…',
        }),
      });
    }

    if (teslaStatus.isError) {
      return buildDashboardSummary({
        firstName,
        tesla: buildErroredTeslaSummary({
          label: 'Status unavailable',
          detail:
            teslaStatus.error.message ??
            'Could not verify Tesla link. Refresh the page or try again.',
          linked: false,
        }),
      });
    }

    if (!teslaLinked) {
      return buildDashboardSummary({
        firstName,
        tesla: DASHBOARD_FALLBACK_TESLA,
      });
    }

    const vehicleData = teslaVehicles.data;
    const vehiclesStillLoading =
      vehicleData === undefined &&
      (teslaVehicles.isLoading || teslaVehicles.isFetching);

    if (vehiclesStillLoading) {
      return buildDashboardSummary({
        firstName,
        tesla: buildPendingTeslaSummary({
          linked: true,
          label: 'Loading',
          detail: 'Fetching live vehicle data from Tesla…',
        }),
      });
    }

    if (teslaVehicles.isError && vehicleData === undefined) {
      return buildDashboardSummary({
        firstName,
        tesla: buildErroredTeslaSummary({
          label: 'Can’t load vehicle',
          detail:
            teslaVehicles.error?.message ??
            'We could not reach Tesla right now. Try again in a moment.',
        }),
      });
    }

    const list = vehicleData ?? [];
    const first =
      pickTeslaVehicleForIdentity(list, profileVehicle) ?? list[0] ?? null;

    if (!first) {
      return buildDashboardSummary({
        firstName,
        tesla: buildErroredTeslaSummary({
          label: 'No vehicle',
          detail:
            'No Tesla vehicle was returned for this account. Add a vehicle in the Tesla app, then tap Refresh.',
        }),
      });
    }

    return buildDashboardSummary({
      firstName,
      tesla: buildLinkedTeslaSummary({
        vehicle: teslaVehicleSummaryToDashboard({
          ...first,
          model: profileVehicle?.model ?? null,
          year: profileVehicle?.year ?? null,
        }),
        refreshedAt:
          teslaVehicles.dataUpdatedAt > 0
            ? new Date(teslaVehicles.dataUpdatedAt).toISOString()
            : new Date().toISOString(),
      }),
    });
  }, [
    profileQuery.data?.firstName,
    teslaLinked,
    teslaStatus.isPending,
    teslaStatus.isError,
    teslaStatus.error,
    teslaVehicles.data,
    teslaVehicles.dataUpdatedAt,
    teslaVehicles.isError,
    teslaVehicles.error,
    teslaVehicles.isLoading,
    teslaVehicles.isFetching,
    vehicleQuery.data?.profile?.identity,
  ]);

  const refresh = async () => {
    if (!teslaLinked) return;
    await utils.tesla.vehicles.invalidate();
  };

  return {
    summary,
    isRefreshing: teslaVehicles.isFetching,
    refresh,
  };
}
