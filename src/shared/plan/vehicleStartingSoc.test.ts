import { describe, expect, it } from 'vitest';
import { PLAN_DEFAULT_STARTING_SOC_PERCENT } from '#/shared/plan/constants';
import { startingSocPercentFromLiveBattery } from '#/shared/plan/vehicleStartingSoc';

describe('startingSocPercentFromLiveBattery', () => {
  it('uses default when live is null', () => {
    expect(startingSocPercentFromLiveBattery(null)).toBe(
      PLAN_DEFAULT_STARTING_SOC_PERCENT,
    );
  });

  it('rounds and clamps to 0–100', () => {
    expect(startingSocPercentFromLiveBattery(72.4)).toBe(72);
    expect(startingSocPercentFromLiveBattery(-5)).toBe(0);
    expect(startingSocPercentFromLiveBattery(100.9)).toBe(100);
  });
});
