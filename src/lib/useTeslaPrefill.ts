import { useEffect, useMemo, useRef } from 'react';
import { trpc } from '#/lib/trpc';

export type TeslaPrefill = {
  make: string;
  model: string | null;
  year: number | null;
  displayName: string | null;
  vin: string | null;
};

export type UseTeslaPrefillResult = {
  /** True once `oauth.status` has confirmed the Tesla account is linked. */
  linked: boolean;
  /** True while Tesla link status is being determined for the first time. */
  statusLoading: boolean;
  /** True while we're fetching vehicles after confirming the account is linked. */
  vehicleLoading: boolean;
  /** True when the Fleet API call errored after a link was detected. */
  vehicleError: boolean;
  /**
   * Best-effort prefill payload for the first decodable vehicle on the
   * account. Null until vehicles resolve (or when the account has none).
   */
  prefill: TeslaPrefill | null;
};

/**
 * Encapsulates the "Tesla is linked → pull vehicles → offer prefill" dance.
 *
 * The hook checks `oauth.status` for the Tesla integration, pulls vehicles
 * via `trpc.tesla.vehicles` only after a link is confirmed, and fires
 * `onPrefill` exactly once per freshly-resolved vehicle id. Callers get the
 * derived state back for UI purposes but do not need a separate effect to
 * translate hook output into side effects.
 */
export function useTeslaPrefill(args: {
  onPrefill?: (prefill: TeslaPrefill) => void;
}): UseTeslaPrefillResult {
  const { onPrefill } = args;

  const status = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const linked = status.data?.linked === true;

  // Only fetch vehicles once we know the account is linked. The tRPC
  // endpoint throws FAILED_PRECONDITION when called while unlinked, so
  // keeping the query cold until `linked` prevents a noisy error cycle
  // during the initial unlinked render.
  const vehicles = trpc.tesla.vehicles.useQuery(undefined, {
    enabled: linked,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const prefill = useMemo<TeslaPrefill | null>(() => {
    if (!linked) return null;
    const list = vehicles.data ?? [];
    if (list.length === 0) return null;
    // Prefer a vehicle we were able to decode a model+year from (i.e. one
    // that actually lets us prefill the form); fall back to the first entry
    // so the UI can still show the Tesla name even if decoding failed.
    const choice =
      list.find((v) => Boolean(v.model) && Boolean(v.year)) ?? list[0];
    if (!choice) return null;
    return {
      make: 'Tesla',
      model: choice.model,
      year: choice.year,
      displayName: choice.displayName,
      vin: choice.vin,
    };
  }, [linked, vehicles.data]);

  // Fire `onPrefill` once per distinct vehicle. Re-using the VIN (or
  // displayName when the VIN is unknown) as a dedupe key keeps us from
  // clobbering user input just because React Query refetched the same data.
  const lastFiredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!prefill || !onPrefill) return;
    const key = prefill.vin ?? prefill.displayName ?? 'unknown';
    if (lastFiredKeyRef.current === key) return;
    lastFiredKeyRef.current = key;
    onPrefill(prefill);
  }, [prefill, onPrefill]);

  // Reset the dedupe key when the user unlinks so relinking later re-fires
  // the prefill for the new account.
  useEffect(() => {
    if (!linked) {
      lastFiredKeyRef.current = null;
    }
  }, [linked]);

  return {
    linked,
    statusLoading: status.isLoading && !status.data,
    vehicleLoading: linked && vehicles.isLoading && !vehicles.data,
    vehicleError: linked && vehicles.isError,
    prefill,
  };
}
