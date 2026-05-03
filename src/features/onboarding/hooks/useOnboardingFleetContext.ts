import { useCallback, useMemo } from 'react';
import { onboardingVehicleSummary } from '#/features/onboarding/utils/vehicleSummary';
import { trpc } from '#/lib/trpc';

/**
 * Tesla + OAuth provider list reads for onboarding CONNECT. No form or stepper;
 * pure tRPC subscription + derived readiness flags.
 */
export function useOnboardingFleetContext() {
  const oauthList = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const teslaStatus = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const teslaLinked = teslaStatus.data?.linked === true;

  const teslaPrefill = trpc.tesla.vehiclePrefill.useQuery(undefined, {
    enabled: teslaLinked,
    staleTime: 60_000,
  });

  const teslaVehicle = teslaPrefill.data?.linked
    ? (teslaPrefill.data.vehicle ?? null)
    : null;

  const identityReady =
    teslaLinked &&
    teslaPrefill.data?.linked === true &&
    teslaVehicle != null &&
    typeof teslaVehicle.model === 'string' &&
    teslaVehicle.model.trim().length > 0 &&
    typeof teslaVehicle.year === 'string' &&
    /^\d{4}$/.test(teslaVehicle.year);

  const prefillSuccess =
    teslaLinked && teslaPrefill.isSuccess && teslaPrefill.data?.linked === true;

  const linkedButNoVinIdentity =
    prefillSuccess && teslaVehicle != null && !identityReady;

  const linkedWithoutVehicleSlot = prefillSuccess && teslaVehicle === null;

  const resolveProviderLabel = useCallback(
    (slug: string) =>
      oauthList.data?.find((p) => p.slug === slug)?.label ??
      slug.charAt(0).toUpperCase() + slug.slice(1),
    [oauthList.data],
  );

  const trimmedTeslaSummary = useMemo(
    () => onboardingVehicleSummary(teslaVehicle).trim(),
    [teslaVehicle],
  );

  const teslaConnectedDetail = useMemo(() => {
    if (trimmedTeslaSummary.length > 0) return trimmedTeslaSummary;
    if (teslaLinked) return 'Live data ready';
    return null;
  }, [trimmedTeslaSummary, teslaLinked]);

  return {
    identityReady,
    linkedButNoVinIdentity,
    linkedWithoutVehicleSlot,
    trimmedTeslaSummary,
    teslaConnectedDetail,
    resolveProviderLabel,
  };
}
