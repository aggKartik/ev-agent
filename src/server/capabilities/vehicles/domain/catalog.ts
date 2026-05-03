import type { EvConnectorSlug } from '#/shared/plan/contracts';

/**
 * Static **Vehicle Energy Profile** catalog. Tesla-only by design (Q12):
 * non-Tesla rows fall through to `PLAN_DEFAULT_*` constants. Every entry
 * carries the per-trip-routing-relevant facts that Tesla Fleet API does
 * not expose:
 *
 *   - usableRangeMiles  : conservative real-world day-trip range
 *   - batteryCapacityKWh: usable pack (not headline EPA)
 *   - consumptionWhPerMile: road-trip-ish heuristic
 *   - connectorTypes    : DC fast-charge plugs the vehicle can use
 *
 * Numbers are deliberately conservative so the EV-routing prefetch
 * doesn't oversell range. The catalog is editable as a normal PR; this
 * is the only file that needs to change when Tesla ships a new trim.
 *
 * Year is a string to match the form/zod schema (`/^\d{4}$/`). Range
 * lookups use exact `(make, model, year)` first; if no exact match,
 * falls back to the latest-year row for the same model.
 */

export type VehicleCatalogEntry = {
  make: string;
  model: string;
  year: string;
  usableRangeMiles: number;
  batteryCapacityKWh: number;
  consumptionWhPerMile: number;
  connectorTypes: EvConnectorSlug[];
};

const TESLA_MODEL_3: VehicleCatalogEntry[] = [
  {
    make: 'Tesla',
    model: 'Model 3',
    year: '2017',
    usableRangeMiles: 220,
    batteryCapacityKWh: 50,
    consumptionWhPerMile: 250,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: '2020',
    usableRangeMiles: 290,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 245,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: '2023',
    usableRangeMiles: 305,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 240,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: '2024',
    usableRangeMiles: 320,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 235,
    connectorTypes: ['NACS'],
  },
];

const TESLA_MODEL_Y: VehicleCatalogEntry[] = [
  {
    make: 'Tesla',
    model: 'Model Y',
    year: '2020',
    usableRangeMiles: 290,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 270,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    year: '2023',
    usableRangeMiles: 295,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 265,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    year: '2024',
    usableRangeMiles: 305,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 260,
    connectorTypes: ['NACS'],
  },
];

const TESLA_MODEL_S: VehicleCatalogEntry[] = [
  {
    make: 'Tesla',
    model: 'Model S',
    year: '2021',
    usableRangeMiles: 380,
    batteryCapacityKWh: 100,
    consumptionWhPerMile: 280,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model S',
    year: '2024',
    usableRangeMiles: 390,
    batteryCapacityKWh: 100,
    consumptionWhPerMile: 275,
    connectorTypes: ['NACS'],
  },
];

const TESLA_MODEL_X: VehicleCatalogEntry[] = [
  {
    make: 'Tesla',
    model: 'Model X',
    year: '2021',
    usableRangeMiles: 320,
    batteryCapacityKWh: 100,
    consumptionWhPerMile: 330,
    connectorTypes: ['NACS', 'CCS1'],
  },
  {
    make: 'Tesla',
    model: 'Model X',
    year: '2024',
    usableRangeMiles: 335,
    batteryCapacityKWh: 100,
    consumptionWhPerMile: 320,
    connectorTypes: ['NACS'],
  },
];

const TESLA_CYBERTRUCK: VehicleCatalogEntry[] = [
  {
    make: 'Tesla',
    model: 'Cybertruck',
    year: '2024',
    usableRangeMiles: 295,
    batteryCapacityKWh: 123,
    consumptionWhPerMile: 430,
    connectorTypes: ['NACS'],
  },
];

export const VEHICLE_CATALOG: VehicleCatalogEntry[] = [
  ...TESLA_MODEL_3,
  ...TESLA_MODEL_Y,
  ...TESLA_MODEL_S,
  ...TESLA_MODEL_X,
  ...TESLA_CYBERTRUCK,
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Catalog lookup with year-tolerant fallback. Returns `null` when nothing
 * matches the make/model — caller falls through to `PLAN_DEFAULT_*`.
 *
 * Year resolution: prefer exact year, otherwise the latest catalog row
 * with year `<=` the requested year (so a 2025 Model 3 inherits 2024
 * specs until someone PRs a 2025 row).
 */
export function findCatalogEntry(
  make: string,
  model: string,
  year: string,
): VehicleCatalogEntry | null {
  const m = normalize(make);
  const md = normalize(model);
  const matches = VEHICLE_CATALOG.filter(
    (entry) => normalize(entry.make) === m && normalize(entry.model) === md,
  );
  if (matches.length === 0) return null;

  const exact = matches.find((entry) => entry.year === year);
  if (exact) return exact;

  const requested = Number.parseInt(year, 10);
  if (!Number.isFinite(requested)) return matches[matches.length - 1] ?? null;

  const olderOrEqual = matches
    .filter((entry) => Number.parseInt(entry.year, 10) <= requested)
    .sort((a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10));
  if (olderOrEqual[0]) return olderOrEqual[0];

  const newerSorted = matches.sort(
    (a, b) => Number.parseInt(a.year, 10) - Number.parseInt(b.year, 10),
  );
  return newerSorted[0] ?? null;
}
