import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import type { EvConnectorSlug } from '#/shared/plan/contracts';
import {
  connectorSetsDifferForOverride,
  numericValuesDifferForOverride,
} from '#/shared/vehicles/overrideCompare';
import { findCatalogEntry } from './catalog';
import type { VehicleOverrides, VehicleRow } from './types';

/**
 * Inputs the plan form sends back to the server when the **Driver**
 * tweaks vehicle numbers per-trip. Mirrors the shape of `PlanRequest`
 * vehicle fields (kept loose because the form value is what the user
 * sees; the diff helper compares against catalog math here).
 */
export type PlanFormVehicleSnapshot = {
  usableRangeMiles: number;
  batteryCapacityKWh: number;
  consumptionWhPerMile: number;
  connectorTypes: EvConnectorSlug[];
};

/**
 * Catalog-relative override diff (baseline = `findCatalogEntry` or
 * `PLAN_DEFAULT_*`). Used for tests and as the canonical spec when
 * comparing form snapshots to factory numbers; the live plan-submit path
 * uses `usePersistVehicleOverrides`, which diffs against the **resolved**
 * `VehicleEnergyProfile` so unchanged values do not bump `updated_at`.
 *
 * Non-trivial choice: connectors are compared as a **set**. Order in
 * the chip row doesn't matter; coverage does.
 */
export function diffOverrides(
  row: Pick<VehicleRow, 'make' | 'model' | 'year'>,
  snapshot: PlanFormVehicleSnapshot,
): VehicleOverrides {
  const catalog = findCatalogEntry(row.make, row.model, row.year);
  const baselineRange =
    catalog?.usableRangeMiles ?? PLAN_DEFAULT_USABLE_RANGE_MILES;
  const baselineCapacity =
    catalog?.batteryCapacityKWh ?? PLAN_DEFAULT_BATTERY_CAPACITY_KWH;
  const baselineConsumption =
    catalog?.consumptionWhPerMile ?? PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE;
  const baselineConnectors = catalog?.connectorTypes ?? [
    ...PLAN_DEFAULT_CONNECTOR_TYPES,
  ];

  return {
    usableRangeMiles: numericValuesDifferForOverride(
      snapshot.usableRangeMiles,
      baselineRange,
    )
      ? snapshot.usableRangeMiles
      : null,
    batteryCapacityKWh: numericValuesDifferForOverride(
      snapshot.batteryCapacityKWh,
      baselineCapacity,
    )
      ? snapshot.batteryCapacityKWh
      : null,
    consumptionWhPerMile: numericValuesDifferForOverride(
      snapshot.consumptionWhPerMile,
      baselineConsumption,
    )
      ? snapshot.consumptionWhPerMile
      : null,
    connectorTypes: connectorSetsDifferForOverride(
      snapshot.connectorTypes,
      baselineConnectors,
    )
      ? snapshot.connectorTypes
      : null,
  };
}
