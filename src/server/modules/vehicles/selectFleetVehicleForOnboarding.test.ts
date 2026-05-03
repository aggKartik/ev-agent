import { describe, expect, it } from 'vitest';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import { selectFleetVehicleForOnboarding } from '#/server/modules/vehicles/selectFleetVehicleForOnboarding';

function mockVehicle(id: string): TeslaVehicleSummary {
  return {
    id,
    vin: null,
    displayName: null,
    state: null,
    odometerMi: null,
    batteryLevel: null,
    usableBatteryLevel: null,
    chargeLimitSoc: null,
    batteryRangeMi: null,
    latitude: null,
    longitude: null,
    gpsAsOf: null,
  };
}

describe('selectFleetVehicleForOnboarding', () => {
  it('returns the row whose string id matches', () => {
    const a = mockVehicle('111');
    const b = mockVehicle('222');
    expect(selectFleetVehicleForOnboarding([a, b], '222')).toBe(b);
  });

  it('trims the requested id', () => {
    const v = mockVehicle('42');
    expect(selectFleetVehicleForOnboarding([v], '  42  ')).toBe(v);
  });

  it('returns null when the id is not in the list', () => {
    expect(
      selectFleetVehicleForOnboarding([mockVehicle('1')], '999'),
    ).toBeNull();
  });

  it('returns null for an empty fleet', () => {
    expect(selectFleetVehicleForOnboarding([], '1')).toBeNull();
  });
});
