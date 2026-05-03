/**
 * Pick the Fleet API row that matches the persisted **Vehicle** identity.
 * Used by dashboard + tRPC so multi-car accounts stay aligned with onboarding.
 */

export type TeslaVehiclePickTarget = {
  id: string;
  vin: string | null;
};

export type TeslaIdentityPick = {
  teslaVehicleId?: string | null;
  vin?: string | null;
};

export function pickTeslaVehicleForIdentity<T extends TeslaVehiclePickTarget>(
  vehicles: T[],
  identity: TeslaIdentityPick | null | undefined,
): T | null {
  if (vehicles.length === 0) return null;
  if (!identity) return vehicles[0] ?? null;

  const tid = identity.teslaVehicleId?.trim();
  if (tid) {
    const byId = vehicles.find((v) => v.id === tid);
    if (byId) return byId;
  }

  const vin = identity.vin?.trim().toUpperCase();
  if (vin) {
    const byVin = vehicles.find((v) => v.vin && v.vin.toUpperCase() === vin);
    if (byVin) return byVin;
  }

  return vehicles[0] ?? null;
}
