import { describe, expect, it } from 'vitest';
import { OAuthError } from '#/server/oauth/errors';
import { isPerVehicleUnavailableFleetError } from './fleet-api';

describe('isPerVehicleUnavailableFleetError', () => {
  it('returns true for HTTP 408 style fleet errors', () => {
    expect(
      isPerVehicleUnavailableFleetError(
        new OAuthError('http_408', 'Fleet API responded 408.'),
      ),
    ).toBe(true);
  });

  it('returns true for Tesla vehicle_unavailable codes', () => {
    expect(
      isPerVehicleUnavailableFleetError(
        new OAuthError('vehicle unavailable', ''),
      ),
    ).toBe(true);
  });

  it('returns false for auth-style errors', () => {
    expect(
      isPerVehicleUnavailableFleetError(
        new OAuthError('invalid_token', 'Unauthorized'),
      ),
    ).toBe(false);
  });

  it('returns false for arbitrary errors', () => {
    expect(isPerVehicleUnavailableFleetError(new Error('network'))).toBe(false);
  });
});
