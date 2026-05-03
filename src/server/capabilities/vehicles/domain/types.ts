import type {
  VehicleEnergyProfile,
  VehicleIdentity,
  VehicleOverrides,
  VehiclePreferences,
} from '#/shared/vehicles/contracts';

/**
 * Re-export the wire types under their domain names so downstream callers
 * (resolveEnergyProfile, diffOverrides, vehicles router) can import from a
 * single place without dragging the whole contracts module in.
 */
export type {
  VehicleEnergyProfile,
  VehicleIdentity,
  VehicleOverrides,
  VehiclePreferences,
};

/**
 * The shape we accept from `db.selectFrom('vehicles')`. Kept narrow so the
 * domain layer doesn't import Kysely's `Selectable<>` machinery.
 */
export type VehicleRow = {
  id: number;
  userId: number;
  make: string;
  model: string;
  year: string;
  vin: string | null;
  teslaVehicleId: string | null;
  targetArrivalSocPercent: number;
  postChargeSocPercent: number;
  overrideUsableRangeMiles: number | null;
  overrideBatteryCapacityKwh: number | null;
  overrideConsumptionWhPerMile: number | null;
  overrideConnectorTypes: string[] | null;
};
