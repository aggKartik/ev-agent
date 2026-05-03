import { useMemo } from 'react';
import type { DashboardSummary } from '#/features/dashboard/types/contracts';
import { DASHBOARD_FALLBACK_TESLA } from '#/features/dashboard/utils/data';
import {
  buildDashboardSummary,
  buildLinkedTeslaSummary,
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

  // Pull the persisted Vehicle row so the car panel can show make/model/year
  // even when Tesla is asleep / unlinked. The route gate guarantees a row.
  const vehicleQuery = trpc.vehicle.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  const summary = useMemo<DashboardSummary>(() => {
    const firstName = profileQuery.data?.firstName ?? null;
    const profileVehicle = vehicleQuery.data?.profile?.identity ?? null;
    const list = teslaVehicles.data ?? [];
    const first =
      pickTeslaVehicleForIdentity(list, profileVehicle) ?? list[0] ?? null;

    if (!teslaLinked || !first) {
      return buildDashboardSummary({
        firstName,
        tesla: DASHBOARD_FALLBACK_TESLA,
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
    teslaVehicles.data,
    teslaVehicles.dataUpdatedAt,
    vehicleQuery.data?.profile?.identity,
    vehicleQuery.data,
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
