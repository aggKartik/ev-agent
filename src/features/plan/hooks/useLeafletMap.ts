import type * as Leaflet from 'leaflet';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type { LeafletModule } from '#/features/plan/map/icons';

type UseLeafletMapResult = {
  mapRef: RefObject<Leaflet.Map | null>;
  leafletRef: RefObject<LeafletModule | null>;
  mapReady: boolean;
  tilesReady: boolean;
};

type ResizeInvalidation = {
  disconnect: () => void;
};

const INITIAL_CENTER: Leaflet.LatLngExpression = [36.7, -120.5];
const INITIAL_ZOOM = 6;
const RESIZE_INVALIDATION_DELAYS_MS = [60, 200, 500, 1000];

/**
 * Mounts a Leaflet map into the provided container element ref and returns
 * mutable refs to the live map / leaflet module, a `mapReady` boolean
 * once the async import and initial view setup have finished, and a
 * `tilesReady` boolean once the primary dark base layer has visually loaded.
 */
export function useLeafletMap(
  elRef: RefObject<HTMLDivElement | null>,
): UseLeafletMapResult {
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resizeInvalidation: ResizeInvalidation | null = null;

    async function mountMap() {
      if (!elRef.current || mapRef.current) return;
      const leaflet = await import('leaflet');
      if (disposed || !elRef.current) return;

      leafletRef.current = leaflet;
      const map = createLeafletMap(leaflet, elRef.current);
      addDarkTileLayers(leaflet, map, {
        isDisposed: () => disposed,
        onBaseTilesLoaded: () => setTilesReady(true),
      });
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      resizeInvalidation = observeMapSize(map, elRef.current);
      setMapReady(true);
    }

    void mountMap();

    return () => {
      disposed = true;
      resizeInvalidation?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, [elRef]);

  return { mapRef, leafletRef, mapReady, tilesReady };
}

function createLeafletMap(
  leaflet: LeafletModule,
  container: HTMLDivElement,
): Leaflet.Map {
  const map = leaflet.map(container, {
    zoomControl: false,
    attributionControl: true,
  });
  map.setView(INITIAL_CENTER, INITIAL_ZOOM);
  return map;
}

function addDarkTileLayers(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  readiness: { isDisposed: () => boolean; onBaseTilesLoaded: () => void },
) {
  const baseTileLayer = leaflet.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      className: 'evagent-tiles',
    },
  );
  baseTileLayer.once('load', () => {
    if (!readiness.isDisposed()) readiness.onBaseTilesLoaded();
  });
  baseTileLayer.addTo(map);

  leaflet
    .tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: 0.65,
        className: 'evagent-labels',
      },
    )
    .addTo(map);
}

function observeMapSize(
  map: Leaflet.Map,
  container: HTMLDivElement,
): ResizeInvalidation {
  const timeoutIds: number[] = [];
  const invalidate = () => map.invalidateSize();
  const resizeObserver = new ResizeObserver(invalidate);

  resizeObserver.observe(container);
  window.addEventListener('resize', invalidate);
  for (const delay of RESIZE_INVALIDATION_DELAYS_MS) {
    timeoutIds.push(window.setTimeout(invalidate, delay));
  }

  return {
    disconnect: () => {
      for (const timeoutId of timeoutIds) window.clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', invalidate);
    },
  };
}
