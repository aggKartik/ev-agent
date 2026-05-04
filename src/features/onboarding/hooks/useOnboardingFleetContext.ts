import { useCallback, useMemo } from 'react';
import { onboardingVehicleSummary } from '#/features/onboarding/utils/vehicleSummary';
import { trpc } from '#/lib/trpc';

function isCatalogIdentityReady(args: {
  model: string | null;
  year: string | null;
}): boolean {
  const model = args.model?.trim();
  const year = args.year;
  return (
    typeof model === 'string' &&
    model.length > 0 &&
    typeof year === 'string' &&
    /^\d{4}$/.test(year)
  );
}

/**
 * Tesla + OAuth provider list reads for onboarding CONNECT. No form or stepper;
 * pure tRPC subscription + derived readiness flags.
 */
export function useOnboardingFleetContext(args: {
  selectedTeslaVehicleId: string;
}) {
  const { selectedTeslaVehicleId } = args;

  const oauthList = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const teslaStatus = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const teslaLinked = teslaStatus.data?.linked === true;

  const fleetQuery = trpc.tesla.vehicles.useQuery(undefined, {
    enabled: teslaLinked,
    staleTime: 60_000,
  });

  const fleetVehicles = fleetQuery.data ?? null;
  const fleetFetchSucceeded = fleetQuery.isSuccess;

  const selectedRow = useMemo(() => {
    if (!fleetVehicles || !selectedTeslaVehicleId.trim()) return null;
    return (
      fleetVehicles.find((v) => v.id === selectedTeslaVehicleId.trim()) ?? null
    );
  }, [fleetVehicles, selectedTeslaVehicleId]);

  const selectedPrefill = selectedRow?.onboardingIdentity ?? null;
  const prefillSuccess = teslaLinked && fleetFetchSucceeded;
  const catalogIdentityReady = isCatalogIdentityReady({
    model: selectedPrefill?.model ?? null,
    year: selectedPrefill?.year ?? null,
  });

  const identityReady =
    prefillSuccess && selectedRow != null && catalogIdentityReady;

  const linkedButNoVinIdentity =
    prefillSuccess &&
    (fleetVehicles?.length ?? 0) > 0 &&
    selectedRow != null &&
    !catalogIdentityReady;

  const linkedWithoutVehicleSlot =
    prefillSuccess && fleetVehicles?.length === 0;

  const resolveProviderLabel = useCallback(
    (slug: string) =>
      oauthList.data?.find((p) => p.slug === slug)?.label ??
      slug.charAt(0).toUpperCase() + slug.slice(1),
    [oauthList.data],
  );

  const trimmedTeslaSummary = useMemo(
    () => onboardingVehicleSummary(selectedPrefill).trim(),
    [selectedPrefill],
  );

  const teslaConnectedDetail = useMemo(() => {
    if (trimmedTeslaSummary.length > 0) return trimmedTeslaSummary;
    if (teslaLinked) return 'Live data ready';
    return null;
  }, [trimmedTeslaSummary, teslaLinked]);

  return {
    teslaLinked,
    identityReady,
    linkedButNoVinIdentity,
    linkedWithoutVehicleSlot,
    trimmedTeslaSummary,
    teslaConnectedDetail,
    resolveProviderLabel,
    fleetVehicles,
    fleetLoading: fleetQuery.isLoading,
    fleetFetchSucceeded,
  };
}
