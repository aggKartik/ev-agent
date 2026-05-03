import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import type { EvConnectorSlug } from '#/shared/plan/contracts';
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

const ABS_EPSILON = 0.5;

/**
 * Compute the override columns we should persist after the **Driver**
 * submits a plan. A field becomes a **Driver Override** only when it
 * meaningfully diverges from the catalog (or `PLAN_DEFAULT_*` if no
 * catalog hit) — otherwise we set it to `null` so reads stay tied to
 * the canonical catalog value as it evolves.
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
    usableRangeMiles: differsNumeric(snapshot.usableRangeMiles, baselineRange)
      ? snapshot.usableRangeMiles
      : null,
    batteryCapacityKWh: differsNumeric(
      snapshot.batteryCapacityKWh,
      baselineCapacity,
    )
      ? snapshot.batteryCapacityKWh
      : null,
    consumptionWhPerMile: differsNumeric(
      snapshot.consumptionWhPerMile,
      baselineConsumption,
    )
      ? snapshot.consumptionWhPerMile
      : null,
    connectorTypes: differsConnectorSet(
      snapshot.connectorTypes,
      baselineConnectors,
    )
      ? snapshot.connectorTypes
      : null,
  };
}

function differsNumeric(value: number, baseline: number): boolean {
  return Math.abs(value - baseline) > ABS_EPSILON;
}

function differsConnectorSet(
  value: EvConnectorSlug[],
  baseline: EvConnectorSlug[],
): boolean {
  if (value.length !== baseline.length) return true;
  const set = new Set(baseline);
  return value.some((slug) => !set.has(slug));
}
