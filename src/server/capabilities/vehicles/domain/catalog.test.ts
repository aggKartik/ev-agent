import { describe, expect, it } from 'vitest';
import { evConnectorSlugSchema } from '#/shared/plan/contracts';
import { findCatalogEntry, VEHICLE_CATALOG } from './catalog';

describe('VEHICLE_CATALOG', () => {
  it('every row has at least one valid connector', () => {
    for (const entry of VEHICLE_CATALOG) {
      expect(entry.connectorTypes.length).toBeGreaterThan(0);
      for (const connector of entry.connectorTypes) {
        const result = evConnectorSlugSchema.safeParse(connector);
        expect(
          result.success,
          `${entry.make} ${entry.model} ${entry.year} :: ${connector}`,
        ).toBe(true);
      }
    }
  });

  it('every row has positive energy facts', () => {
    for (const entry of VEHICLE_CATALOG) {
      expect(entry.usableRangeMiles).toBeGreaterThan(0);
      expect(entry.batteryCapacityKWh).toBeGreaterThan(0);
      expect(entry.consumptionWhPerMile).toBeGreaterThan(0);
    }
  });

  it('is Tesla-only by design (Q12)', () => {
    for (const entry of VEHICLE_CATALOG) {
      expect(entry.make).toBe('Tesla');
    }
  });
});

describe('findCatalogEntry', () => {
  it('returns an exact-year hit when present', () => {
    const entry = findCatalogEntry('Tesla', 'Model 3', '2024');
    expect(entry?.year).toBe('2024');
  });

  it('falls back to the latest year less-or-equal to the requested year', () => {
    // 2025 has no row; the closest older row is 2024.
    const entry = findCatalogEntry('Tesla', 'Model Y', '2025');
    expect(entry?.year).toBe('2024');
  });

  it('falls back to the oldest row when the requested year predates all entries', () => {
    const entry = findCatalogEntry('Tesla', 'Model S', '2015');
    expect(entry?.year).toBe('2021');
  });

  it('returns null for an unknown make/model', () => {
    expect(findCatalogEntry('Polestar', '2', '2023')).toBeNull();
    expect(findCatalogEntry('Tesla', 'Roadster', '2024')).toBeNull();
  });

  it('is case- and whitespace-insensitive on make and model', () => {
    const a = findCatalogEntry('tesla', 'model 3', '2024');
    const b = findCatalogEntry('Tesla', '  Model 3  ', '2024');
    expect(a?.year).toBe('2024');
    expect(b?.year).toBe('2024');
  });
});
