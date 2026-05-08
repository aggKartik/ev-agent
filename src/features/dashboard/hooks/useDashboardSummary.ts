import type { inferRouterOutputs } from '@trpc/server';
import { useMemo } from 'react';
import type { DashboardSummary } from '#/features/dashboard/types/contracts';
import {
  buildDashboardSummary,
  type ComposeTeslaInput,
  composeTeslaSummary,
} from '#/features/dashboard/utils/helpers';
import { trpc } from '#/lib/trpc';
import type { AppRouter } from '#/server/platform/trpc/router';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';

type TeslaVehicleClientRow =
  inferRouterOutputs<AppRouter>['tesla']['vehicles'][number];

type TeslaStatusQuery = {
  data: { linked: boolean } | undefined;
  isPending: boolean;
  isError: boolean;
  error: { message?: string } | null;
};

type TeslaVehiclesQuery = {
  data: TeslaVehicleClientRow[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: { message?: string } | null;
  dataUpdatedAt: number;
};

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
    const tesla = composeTeslaSummary({
      teslaStatus: deriveTeslaStatus(teslaStatus, teslaLinked),
      vehiclesQuery: deriveVehiclesQuery(teslaVehicles),
      profileVehicle: vehicleQuery.data?.vehicle ?? null,
      pickVehicle: pickTeslaVehicleForIdentity,
    });
    return buildDashboardSummary({ firstName, tesla });
  }, [
    profileQuery.data?.firstName,
    teslaLinked,
    teslaStatus,
    teslaVehicles,
    vehicleQuery.data?.vehicle,
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

function deriveTeslaStatus(
  q: TeslaStatusQuery,
  linked: boolean,
): ComposeTeslaInput['teslaStatus'] {
  if (q.isPending) return { kind: 'pending' };
  if (q.isError) {
    return {
      kind: 'errored',
      message: q.error?.message ?? '',
    };
  }
  return linked ? { kind: 'linked' } : { kind: 'unlinked' };
}

function deriveVehiclesQuery(
  q: TeslaVehiclesQuery,
): ComposeTeslaInput['vehiclesQuery'] {
  const stillLoading = q.data === undefined && (q.isLoading || q.isFetching);
  if (stillLoading) return { kind: 'loading' };
  if (q.isError && q.data === undefined) {
    return { kind: 'errored', message: q.error?.message ?? '' };
  }
  const refreshedAt =
    q.dataUpdatedAt > 0
      ? new Date(q.dataUpdatedAt).toISOString()
      : new Date().toISOString();
  return { kind: 'ready', data: q.data ?? [], refreshedAt };
}
