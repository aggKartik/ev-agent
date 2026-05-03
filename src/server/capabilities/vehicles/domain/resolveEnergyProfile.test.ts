import { describe, expect, it } from 'vitest';
import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import { resolveEnergyProfile } from './resolveEnergyProfile';
import type { VehicleRow } from './types';

function row(overrides: Partial<VehicleRow> = {}): VehicleRow {
  return {
    id: 1,
    userId: 1,
    make: 'Tesla',
    model: 'Model 3',
    year: '2024',
    vin: null,
    teslaVehicleId: null,
    targetArrivalSocPercent: 20,
    postChargeSocPercent: 85,
    overrideUsableRangeMiles: null,
    overrideBatteryCapacityKwh: null,
    overrideConsumptionWhPerMile: null,
    overrideConnectorTypes: null,
    ...overrides,
  };
}

describe('resolveEnergyProfile', () => {
  it('uses the catalog value when no override is set', () => {
    const profile = resolveEnergyProfile(row());
    expect(profile.hasCatalogMatch).toBe(true);
    expect(profile.usableRangeMiles).toBe(320);
    expect(profile.batteryCapacityKWh).toBe(75);
    expect(profile.consumptionWhPerMile).toBe(235);
    expect(profile.connectorTypes).toEqual(['NACS']);
  });

  it('lets a Driver override beat the catalog field-by-field', () => {
    const profile = resolveEnergyProfile(
      row({
        overrideUsableRangeMiles: 250,
        overrideConsumptionWhPerMile: 310,
      }),
    );
    expect(profile.usableRangeMiles).toBe(250);
    expect(profile.consumptionWhPerMile).toBe(310);
    expect(profile.batteryCapacityKWh).toBe(75);
    expect(profile.connectorTypes).toEqual(['NACS']);
  });

  it('falls back to plan defaults for non-catalog vehicles', () => {
    const profile = resolveEnergyProfile(
      row({ make: 'Polestar', model: '2', year: '2023' }),
    );
    expect(profile.hasCatalogMatch).toBe(false);
    expect(profile.usableRangeMiles).toBe(PLAN_DEFAULT_USABLE_RANGE_MILES);
    expect(profile.batteryCapacityKWh).toBe(PLAN_DEFAULT_BATTERY_CAPACITY_KWH);
    expect(profile.consumptionWhPerMile).toBe(
      PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
    );
    expect(profile.connectorTypes).toEqual([...PLAN_DEFAULT_CONNECTOR_TYPES]);
  });

  it('treats a null override column as "use catalog"', () => {
    const profile = resolveEnergyProfile(
      row({
        overrideUsableRangeMiles: null,
        overrideBatteryCapacityKwh: null,
      }),
    );
    expect(profile.usableRangeMiles).toBe(320);
    expect(profile.batteryCapacityKWh).toBe(75);
  });

  it('drops invalid connector overrides and falls back to catalog', () => {
    const profile = resolveEnergyProfile(
      row({
        overrideConnectorTypes: ['NOT_A_REAL_CONNECTOR'],
      }),
    );
    expect(profile.connectorTypes).toEqual(['NACS']);
  });

  it('keeps a partially valid connector override', () => {
    const profile = resolveEnergyProfile(
      row({
        overrideConnectorTypes: ['CCS1', 'BOGUS'],
      }),
    );
    expect(profile.connectorTypes).toEqual(['CCS1']);
  });

  it('exposes preferences from the row verbatim', () => {
    const profile = resolveEnergyProfile(
      row({ targetArrivalSocPercent: 30, postChargeSocPercent: 90 }),
    );
    expect(profile.preferences).toEqual({
      targetArrivalSocPercent: 30,
      postChargeSocPercent: 90,
    });
  });

  it('falls back to a catalog row from an earlier year', () => {
    const profile = resolveEnergyProfile(
      row({ model: 'Model 3', year: '2021' }),
    );
    // Closest non-newer year row is 2020.
    expect(profile.usableRangeMiles).toBe(290);
  });

  it('builds a sensible vehicleLabel for the form header', () => {
    const profile = resolveEnergyProfile(row());
    expect(profile.vehicleLabel).toBe('2024 Tesla Model 3');
  });
});
