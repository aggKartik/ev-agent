import type { EvConnectorSlug } from '#/shared/plan/contracts';

/**
 * Tolerance for comparing numeric vehicle fields when deciding if a Driver
 * value should persist as an override. Used by `usePersistVehicleOverrides`
 * (diff vs resolved profile) and `diffOverrides` (diff vs catalog baseline).
 */
export const VEHICLE_NUMERIC_OVERRIDE_EPSILON = 0.5;

export function numericValuesDifferForOverride(a: number, b: number): boolean {
  return Math.abs(a - b) > VEHICLE_NUMERIC_OVERRIDE_EPSILON;
}

/**
 * Connector lists are compared as sets (order ignored), matching
 * `diffOverrides` / upsert semantics.
 */
export function connectorSetsDifferForOverride(
  value: EvConnectorSlug[],
  baseline: EvConnectorSlug[],
): boolean {
  if (value.length !== baseline.length) return true;
  const set = new Set(baseline);
  return value.some((slug) => !set.has(slug));
}
