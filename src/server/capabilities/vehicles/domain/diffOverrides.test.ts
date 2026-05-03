import { describe, expect, it } from 'vitest';
import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import { diffOverrides } from './diffOverrides';

const TESLA_2024 = { make: 'Tesla', model: 'Model 3', year: '2024' } as const;

describe('diffOverrides', () => {
  it('returns all-null when the snapshot matches the catalog', () => {
    const overrides = diffOverrides(TESLA_2024, {
      usableRangeMiles: 320,
      batteryCapacityKWh: 75,
      consumptionWhPerMile: 235,
      connectorTypes: ['NACS'],
    });
    expect(overrides).toEqual({
      usableRangeMiles: null,
      batteryCapacityKWh: null,
      consumptionWhPerMile: null,
      connectorTypes: null,
    });
  });

  it('persists only the fields that diverge from the catalog', () => {
    const overrides = diffOverrides(TESLA_2024, {
      usableRangeMiles: 280,
      batteryCapacityKWh: 75,
      consumptionWhPerMile: 235,
      connectorTypes: ['NACS'],
    });
    expect(overrides.usableRangeMiles).toBe(280);
    expect(overrides.batteryCapacityKWh).toBeNull();
    expect(overrides.consumptionWhPerMile).toBeNull();
    expect(overrides.connectorTypes).toBeNull();
  });

  it('treats connector arrays as sets (order does not count)', () => {
    const overrides = diffOverrides(
      { make: 'Tesla', model: 'Model 3', year: '2023' },
      {
        usableRangeMiles: 305,
        batteryCapacityKWh: 75,
        consumptionWhPerMile: 240,
        connectorTypes: ['CCS1', 'NACS'],
      },
    );
    expect(overrides.connectorTypes).toBeNull();
  });

  it('flags connector additions as overrides', () => {
    const overrides = diffOverrides(TESLA_2024, {
      usableRangeMiles: 320,
      batteryCapacityKWh: 75,
      consumptionWhPerMile: 235,
      connectorTypes: ['NACS', 'CCS1'],
    });
    expect(overrides.connectorTypes).toEqual(['NACS', 'CCS1']);
  });

  it('persists only fields that diverge from plan defaults when there is no catalog hit', () => {
    const overrides = diffOverrides(
      { make: 'Polestar', model: '2', year: '2023' },
      {
        usableRangeMiles: 270,
        batteryCapacityKWh: 78,
        consumptionWhPerMile: 290,
        connectorTypes: ['CCS1'],
      },
    );
    expect(overrides).toEqual({
      usableRangeMiles: 270,
      batteryCapacityKWh: 78,
      consumptionWhPerMile: 290,
      connectorTypes: ['CCS1'],
    });
  });

  it('returns all-null when there is no catalog hit but snapshot matches plan defaults', () => {
    const overrides = diffOverrides(
      { make: 'Polestar', model: '2', year: '2023' },
      {
        usableRangeMiles: PLAN_DEFAULT_USABLE_RANGE_MILES,
        batteryCapacityKWh: PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
        consumptionWhPerMile: PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
        connectorTypes: [...PLAN_DEFAULT_CONNECTOR_TYPES],
      },
    );
    expect(overrides).toEqual({
      usableRangeMiles: null,
      batteryCapacityKWh: null,
      consumptionWhPerMile: null,
      connectorTypes: null,
    });
  });

  it('tolerates float drift within VEHICLE_NUMERIC_OVERRIDE_EPSILON', () => {
    const overrides = diffOverrides(TESLA_2024, {
      usableRangeMiles: 320.4,
      batteryCapacityKWh: 75.49,
      consumptionWhPerMile: 234.8,
      connectorTypes: ['NACS'],
    });
    expect(overrides.usableRangeMiles).toBeNull();
    expect(overrides.batteryCapacityKWh).toBeNull();
    expect(overrides.consumptionWhPerMile).toBeNull();
  });
});
