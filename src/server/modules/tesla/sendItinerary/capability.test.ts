import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSendItineraryCapability,
  SEND_ITINERARY_MISSING_PROXY_MESSAGE,
  SEND_ITINERARY_UNVERIFIED_PROXY_MESSAGE,
} from './capability';

const mocks = vi.hoisted(() => ({
  proxyUrl: vi.fn(),
  enabled: vi.fn(),
}));

vi.mock('#/server/integrations/tesla/config', () => ({
  teslaCommandProxyUrl: mocks.proxyUrl,
  teslaSendItineraryEnabled: mocks.enabled,
}));

describe('getSendItineraryCapability', () => {
  beforeEach(() => {
    mocks.proxyUrl.mockReset();
    mocks.enabled.mockReset();
    mocks.enabled.mockReturnValue(false);
    mocks.proxyUrl.mockReturnValue(null);
  });

  it('is unavailable by default until proxy support is verified', () => {
    expect(getSendItineraryCapability()).toEqual({
      available: false,
      reason: SEND_ITINERARY_UNVERIFIED_PROXY_MESSAGE,
    });
  });

  it('requires a configured proxy even when the feature is enabled', () => {
    mocks.enabled.mockReturnValue(true);

    expect(getSendItineraryCapability()).toEqual({
      available: false,
      reason: SEND_ITINERARY_MISSING_PROXY_MESSAGE,
    });
  });

  it('is available only when enabled with a command proxy URL', () => {
    mocks.enabled.mockReturnValue(true);
    mocks.proxyUrl.mockReturnValue('https://proxy.example.test');

    expect(getSendItineraryCapability()).toEqual({
      available: true,
      reason: null,
    });
  });
});
