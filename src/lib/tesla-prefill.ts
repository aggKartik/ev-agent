import type { TeslaVehicleSummary } from '#/server/integrations/tesla';

/**
 * Mapping from Fleet API `vehicle_config.car_type` values to the model
 * labels rendered in the MAKE/MODEL step. These must match the entries in
 * `src/components/onboarding/ModelStep.tsx` so the prefilled option is the
 * same tile the user sees selected.
 */
const CAR_TYPE_TO_MODEL: Record<string, string> = {
  model3: 'Model 3',
  modely: 'Model Y',
  models: 'Model S',
  modelx: 'Model X',
  cybertruck: 'Cybertruck',
};

/**
 * Standard VIN model-year codes (ISO 3779). Year is encoded at position 10
 * (index 9) and cycles through 30 characters skipping I, O, Q, U, Z.
 * Covers 2010–2030 which spans every currently-fieldable Tesla.
 */
const VIN_YEAR_CODES: Record<string, number> = {
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
  Y: 2030,
};

export function teslaModelFromCarType(carType: string | null): string | null {
  if (!carType) return null;
  return CAR_TYPE_TO_MODEL[carType.toLowerCase()] ?? null;
}

export function teslaYearFromVin(vin: string | null): string | null {
  if (!vin || vin.length < 10) return null;
  const code = vin.charAt(9).toUpperCase();
  const year = VIN_YEAR_CODES[code];
  return typeof year === 'number' ? String(year) : null;
}

export type TeslaPrefill = {
  make: string;
  model: string | null;
  year: string | null;
};

export function derivePrefillFromVehicle(
  vehicle: TeslaVehicleSummary,
): TeslaPrefill {
  return {
    make: 'Tesla',
    model: teslaModelFromCarType(vehicle.carType),
    year: teslaYearFromVin(vehicle.vin),
  };
}
