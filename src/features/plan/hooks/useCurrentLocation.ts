import { useEffect, useMemo, useState } from 'react';
import { trpc } from '#/lib/trpc';
import type { PlanAddress } from '#/shared/plan/contracts';

/**
 * Resolve the **Driver**'s current location for the START field, in this
 * priority (Q7):
 *
 *   1. Tesla Fleet `drive_state.gps` when the vehicle is awake.
 *   2. `navigator.geolocation` once the user grants permission.
 *   3. Nothing — the START field stays empty and the chip is hidden.
 *
 * Returns the resolved address (reverse-geocoded for a human label) plus a
 * `source` discriminator that the chip uses to render an honest label
 * (`AUTO · FROM CAR` vs `AUTO · THIS DEVICE`).
 *
 * Single-purpose hook: composes the necessary tRPC queries + browser API
 * + the reverse-geocode round trip and projects them into one
 * `{ address, source, asOf }` shape. No timers, no manual writes to
 * downstream stores.
 */
export type CurrentLocationSource = 'tesla' | 'device' | null;

export type CurrentLocation = {
  address: PlanAddress | null;
  source: CurrentLocationSource;
  asOf: string | null;
};

export function useCurrentLocation(): CurrentLocation {
  const teslaCurrent = trpc.tesla.currentLocation.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  });

  const [deviceCoord, setDeviceCoord] = useState<{
    coordinate: { lat: number; lng: number };
    asOf: string;
  } | null>(null);

  // Browser geolocation only fires when Tesla can't help. We don't prompt
  // the user proactively — the next tick after Tesla resolves to null we
  // attempt navigator.geolocation; the browser will surface its own
  // permission UI on the first call.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (teslaCurrent.isLoading) return;
    if (teslaCurrent.data) return;
    if (deviceCoord) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoord({
          coordinate: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          asOf: new Date(position.timestamp).toISOString(),
        });
      },
      () => {
        // Permission denied / unavailable — leave deviceCoord null so the
        // START field stays empty.
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 },
    );
  }, [teslaCurrent.isLoading, teslaCurrent.data, deviceCoord]);

  const teslaCoord = teslaCurrent.data
    ? {
        coordinate: {
          lat: teslaCurrent.data.lat,
          lng: teslaCurrent.data.lng,
        },
        asOf: teslaCurrent.data.asOf,
      }
    : null;

  const source: CurrentLocationSource = teslaCoord
    ? 'tesla'
    : deviceCoord
      ? 'device'
      : null;
  const coord = teslaCoord ?? deviceCoord;

  const reverse = trpc.plan.reverseGeocode.useQuery(
    coord
      ? { coordinate: coord.coordinate }
      : { coordinate: { lat: 0, lng: 0 } },
    {
      enabled: !!coord,
      staleTime: 5 * 60_000,
    },
  );

  return useMemo<CurrentLocation>(() => {
    if (!coord) return { address: null, source: null, asOf: null };
    const address = reverse.data ?? {
      full: source === 'tesla' ? 'Tesla GPS fix' : 'Current location',
      coordinate: coord.coordinate,
    };
    return { address, source, asOf: coord.asOf };
  }, [coord, reverse.data, source]);
}
