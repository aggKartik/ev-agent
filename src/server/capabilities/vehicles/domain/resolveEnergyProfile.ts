import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import type { EvConnectorSlug } from '#/shared/plan/contracts';
import { evConnectorSlugSchema } from '#/shared/plan/contracts';
import { findCatalogEntry } from './catalog';
import type { VehicleEnergyProfile, VehicleRow } from './types';

/**
 * Read-time merger for the **Vehicle Energy Profile**. Single source of
 * truth for "what does the plan agent think this car can do?".
 *
 * Priority per field: `override -> catalog -> PLAN_DEFAULT_*`.
 *
 *   - Driver overrides win when present (non-null on the row).
 *   - Catalog hit fills in everything Tesla can't tell us (kWh, Wh/mi,
 *     connectors, conservative range).
 *   - Otherwise the platform default carries.
 *
 * Pure function: no I/O, no Date.now(), safe to call from the plan
 * router and from tests.
 */
export function resolveEnergyProfile(row: VehicleRow): VehicleEnergyProfile {
  const catalog = findCatalogEntry(row.make, row.model, row.year);

  const overrideConnectors = parseConnectorOverride(row.overrideConnectorTypes);

  return {
    identity: {
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin ?? undefined,
      teslaVehicleId: row.teslaVehicleId ?? undefined,
    },
    vehicleLabel: `${row.year} ${row.make} ${row.model}`,
    usableRangeMiles:
      row.overrideUsableRangeMiles ??
      catalog?.usableRangeMiles ??
      PLAN_DEFAULT_USABLE_RANGE_MILES,
    batteryCapacityKWh:
      row.overrideBatteryCapacityKwh ??
      catalog?.batteryCapacityKWh ??
      PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
    consumptionWhPerMile:
      row.overrideConsumptionWhPerMile ??
      catalog?.consumptionWhPerMile ??
      PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
    connectorTypes: overrideConnectors ??
      catalog?.connectorTypes ?? [...PLAN_DEFAULT_CONNECTOR_TYPES],
    preferences: {
      targetArrivalSocPercent: row.targetArrivalSocPercent,
      postChargeSocPercent: row.postChargeSocPercent,
    },
    hasCatalogMatch: catalog !== null,
  };
}

function parseConnectorOverride(
  raw: string[] | null,
): EvConnectorSlug[] | null {
  if (!raw) return null;
  const parsed = raw
    .map((slug) => {
      const result = evConnectorSlugSchema.safeParse(slug);
      return result.success ? result.data : null;
    })
    .filter((slug): slug is EvConnectorSlug => slug !== null);
  return parsed.length > 0 ? parsed : null;
}
