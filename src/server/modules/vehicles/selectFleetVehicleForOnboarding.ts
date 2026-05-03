import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';

/** Resolves the Fleet API row the user picked during onboarding. */
export function selectFleetVehicleForOnboarding(
  vehicles: TeslaVehicleSummary[],
  teslaVehicleId: string,
): TeslaVehicleSummary | null {
  const wanted = teslaVehicleId.trim();
  return vehicles.find((v) => String(v.id) === wanted) ?? null;
}
