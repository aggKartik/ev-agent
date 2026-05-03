import { describe, expect, it } from 'vitest';
import { pickTeslaVehicleForIdentity } from './teslaPick';

describe('pickTeslaVehicleForIdentity', () => {
  const vehicles = [
    { id: '1', vin: 'VIN111' },
    { id: '2', vin: 'VIN222' },
  ];

  it('returns first when identity is missing', () => {
    expect(pickTeslaVehicleForIdentity(vehicles, null)).toEqual(vehicles[0]);
  });

  it('matches teslaVehicleId', () => {
    expect(
      pickTeslaVehicleForIdentity(vehicles, { teslaVehicleId: '2' }),
    ).toEqual(vehicles[1]);
  });

  it('matches VIN case-insensitively', () => {
    expect(pickTeslaVehicleForIdentity(vehicles, { vin: 'vin222' })).toEqual(
      vehicles[1],
    );
  });

  it('returns null for empty list', () => {
    expect(pickTeslaVehicleForIdentity([], { teslaVehicleId: '1' })).toBeNull();
  });
});
