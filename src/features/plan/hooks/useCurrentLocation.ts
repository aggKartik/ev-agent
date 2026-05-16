import { useEffect, useMemo, useState } from 'react';
import { trpc } from '#/lib/trpc';
import type { Coordinate, PlanAddress } from '#/shared/plan/contracts';

type LocatedCoordinate = {
  coordinate: Coordinate;
  asOf: string;
};

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
  isPending: boolean;
};

type TeslaCurrentLocation = {
  lat: number;
  lng: number;
  asOf: string | null;
} | null;

function toTeslaCoordinate(
  location: TeslaCurrentLocation | undefined,
): LocatedCoordinate | null {
  if (!location) return null;
  return {
    coordinate: {
      lat: location.lat,
      lng: location.lng,
    },
    asOf: location.asOf ?? new Date().toISOString(),
  };
}

function toCurrentLocationAddress(args: {
  coord: LocatedCoordinate | null;
  reverseAddress: PlanAddress | undefined;
  source: CurrentLocationSource;
  isPending: boolean;
}): CurrentLocation {
  const { coord, reverseAddress, source, isPending } = args;
  if (!coord) return { address: null, source: null, asOf: null, isPending };

  const address = reverseAddress ?? {
    full: source === 'tesla' ? 'Tesla GPS fix' : 'Current location',
    coordinate: coord.coordinate,
  };

  return { address, source, asOf: coord.asOf, isPending };
}

function useDeviceCoordinate(args: {
  teslaLoading: boolean;
  teslaCoord: LocatedCoordinate | null;
}): { coord: LocatedCoordinate | null; lookupDone: boolean } {
  const { teslaLoading, teslaCoord } = args;
  const [coord, setCoord] = useState<LocatedCoordinate | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    const shouldLookup =
      typeof window !== 'undefined' &&
      !teslaLoading &&
      !teslaCoord &&
      !coord &&
      !lookupDone;
    if (!shouldLookup) return;

    const geolocation = navigator.geolocation;
    if (!geolocation) {
      setLookupDone(true);
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        setCoord({
          coordinate: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          asOf: new Date(position.timestamp).toISOString(),
        });
        setLookupDone(true);
      },
      () => {
        // Permission denied / unavailable — leave deviceCoord null so the
        // START field stays empty.
        setLookupDone(true);
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 },
    );
  }, [coord, lookupDone, teslaCoord, teslaLoading]);

  return { coord, lookupDone };
}

export function useCurrentLocation(): CurrentLocation {
  const teslaCurrent = trpc.tesla.currentLocation.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  });
  const teslaCoord = toTeslaCoordinate(teslaCurrent.data);
  const device = useDeviceCoordinate({
    teslaLoading: teslaCurrent.isLoading,
    teslaCoord,
  });
  const coord = teslaCoord ?? device.coord;
  const source: CurrentLocationSource = teslaCoord
    ? 'tesla'
    : device.coord
      ? 'device'
      : null;

  const reverse = trpc.plan.reverseGeocode.useQuery(
    coord
      ? { coordinate: coord.coordinate }
      : { coordinate: { lat: 0, lng: 0 } },
    {
      enabled: !!coord,
      staleTime: 5 * 60_000,
    },
  );

  const isPending =
    teslaCurrent.isLoading ||
    (!teslaCurrent.data && !device.coord && !device.lookupDone);

  return useMemo(
    () =>
      toCurrentLocationAddress({
        coord,
        reverseAddress: reverse.data ?? undefined,
        source,
        isPending,
      }),
    [coord, isPending, reverse.data, source],
  );
}
