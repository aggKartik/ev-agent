import { describe, expect, it } from 'vitest';
import {
  connectorSetsDifferForOverride,
  numericValuesDifferForOverride,
  VEHICLE_NUMERIC_OVERRIDE_EPSILON,
} from './overrideCompare';

describe('overrideCompare', () => {
  it('numericValuesDifferForOverride respects VEHICLE_NUMERIC_OVERRIDE_EPSILON', () => {
    expect(numericValuesDifferForOverride(100, 100)).toBe(false);
    expect(
      numericValuesDifferForOverride(
        100,
        100 + VEHICLE_NUMERIC_OVERRIDE_EPSILON,
      ),
    ).toBe(false);
    expect(
      numericValuesDifferForOverride(
        100,
        100 + VEHICLE_NUMERIC_OVERRIDE_EPSILON + 0.01,
      ),
    ).toBe(true);
  });

  it('connectorSetsDifferForOverride ignores order', () => {
    expect(
      connectorSetsDifferForOverride(['NACS', 'CCS1'], ['CCS1', 'NACS']),
    ).toBe(false);
  });

  it('connectorSetsDifferForOverride detects length and membership changes', () => {
    expect(connectorSetsDifferForOverride(['NACS'], ['NACS', 'CCS1'])).toBe(
      true,
    );
    expect(connectorSetsDifferForOverride(['J1772'], ['NACS'])).toBe(true);
  });
});
