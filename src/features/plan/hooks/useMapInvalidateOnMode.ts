import type * as Leaflet from 'leaflet';
import { type RefObject, useEffect } from 'react';
import type { PlanMapMode } from '#/features/plan/store';

const INVALIDATE_DELAY_MS = 240;

/**
 * After the plan map `mode` changes, the surrounding chrome may resize
 * (e.g. the topbar appearing in `'ready'`), so we wait one frame past the
 * transition and call `invalidateSize()` so Leaflet recomputes its viewport.
 */
export function useMapInvalidateOnMode(
  mapRef: RefObject<Leaflet.Map | null>,
  mode: PlanMapMode | undefined,
) {
  useEffect(() => {
    if (!mode) return undefined;
    const timeout = window.setTimeout(
      () => mapRef.current?.invalidateSize(),
      INVALIDATE_DELAY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [mode, mapRef]);
}
