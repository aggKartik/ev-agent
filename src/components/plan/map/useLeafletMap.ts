import type * as Leaflet from 'leaflet';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type { LeafletModule } from './icons';

type UseLeafletMapResult = {
  mapRef: RefObject<Leaflet.Map | null>;
  leafletRef: RefObject<LeafletModule | null>;
  mapReady: boolean;
};

/**
 * Mounts a Leaflet map into the provided container element ref and returns
 * mutable refs to the live map / leaflet module plus a `mapReady` boolean
 * once the async import and initial view setup have finished.
 */
export function useLeafletMap(
  elRef: RefObject<HTMLDivElement | null>,
): UseLeafletMapResult {
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeHandler: (() => void) | null = null;

    async function mountMap() {
      if (!elRef.current || mapRef.current) return;
      const leaflet = await import('leaflet');
      if (disposed || !elRef.current) return;

      leafletRef.current = leaflet;
      const map = leaflet.map(elRef.current, {
        zoomControl: false,
        attributionControl: true,
      });
      map.setView([36.7, -120.5], 6);

      leaflet
        .tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          {
            subdomains: 'abcd',
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            className: 'evagent-tiles',
          },
        )
        .addTo(map);
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

      leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      const invalidate = () => map.invalidateSize();
      resizeHandler = invalidate;
      resizeObserver = new ResizeObserver(invalidate);
      resizeObserver.observe(elRef.current);
      window.addEventListener('resize', invalidate);
      for (const delay of [60, 200, 500, 1000]) {
        window.setTimeout(invalidate, delay);
      }
      setMapReady(true);
    }

    void mountMap();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, [elRef]);

  return { mapRef, leafletRef, mapReady };
}
