import { describe, expect, it } from 'vitest';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import {
  completeOnboardingInputFromFleetSummary,
  teslaPrefillVehicleFromFleetSummary,
} from '#/server/integrations/tesla/onboardingIdentity';

function summary(overrides: Partial<TeslaVehicleSummary>): TeslaVehicleSummary {
  return {
    id: '8842',
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
    ...overrides,
  };
}

describe('onboardingIdentity', () => {
  it('maps Fleet summary to prefill hints from VIN decode', () => {
    const v = teslaPrefillVehicleFromFleetSummary(
      summary({
        vin: '5YJYGDEE0LF000000',
      }),
    );

    expect(v.make).toBe('Tesla');
    expect(v.model).toBe('Model Y');
    expect(v.year).toBe('2020');
  });

  it('completeOnboardingInputFromFleetSummary returns persisted identity', () => {
    const input = completeOnboardingInputFromFleetSummary(
      summary({
        id: '99',
        vin: '5YJYGDEE0LF000000',
      }),
    );

    expect(input).toEqual({
      make: 'Tesla',
      model: 'Model Y',
      year: '2020',
      vin: '5YJYGDEE0LF000000',
      teslaVehicleId: '99',
    });
  });

  it('returns null identity when model/year cannot be decoded', () => {
    expect(
      completeOnboardingInputFromFleetSummary(
        summary({
          vin: 'ZZZZZZZZZZZZZZZZZ',
        }),
      ),
    ).toBeNull();
  });

  it('returns null identity when vin is invalid length', () => {
    expect(
      completeOnboardingInputFromFleetSummary(
        summary({
          vin: 'SHORT',
        }),
      ),
    ).toBeNull();
  });
});
