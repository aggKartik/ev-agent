import {
  teslaCommandProxyUrl,
  teslaSendItineraryEnabled,
} from '#/server/integrations/tesla/config';

export type SendItineraryCapability = {
  available: boolean;
  reason: string | null;
};

export const SEND_ITINERARY_UNVERIFIED_PROXY_MESSAGE =
  'Send to Tesla is disabled until this deployment verifies command proxy support for navigation waypoints.';

export const SEND_ITINERARY_MISSING_PROXY_MESSAGE =
  'TESLA_COMMAND_PROXY_URL is required before Send to Tesla can be enabled.';

export function getSendItineraryCapability(): SendItineraryCapability {
  if (!teslaSendItineraryEnabled()) {
    return {
      available: false,
      reason: SEND_ITINERARY_UNVERIFIED_PROXY_MESSAGE,
    };
  }

  if (!teslaCommandProxyUrl()) {
    return {
      available: false,
      reason: SEND_ITINERARY_MISSING_PROXY_MESSAGE,
    };
  }

  return { available: true, reason: null };
}
