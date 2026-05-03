import type * as Leaflet from 'leaflet';
import type { PlanResult } from '#/shared/plan/contracts';

export type LeafletModule = typeof import('leaflet');

export const PLAN_COLORS = {
  start: 'var(--colors-peach-400)',
  end: 'var(--colors-magenta-400)',
};

export const iconSvg = {
  bolt: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 13h6l-1 8 9-11h-6l1-7Z"/></svg>',
  crosshair:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h10l-1.5 3L15 10H5Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
};

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );
}

export function makePinIcon(
  leaflet: LeafletModule,
  stop: Pick<
    PlanResult['stops'][number],
    'color' | 'iconKey' | 'kind' | 'name'
  >,
) {
  const color =
    stop.color ?? (stop.kind === 'end' ? PLAN_COLORS.end : PLAN_COLORS.start);
  return leaflet.divIcon({
    className: 'evagent-pin',
    html: `<div class="pin-halo" style="--c:${color}"></div><div class="pin-core ${stop.kind}" style="--c:${color}">${iconSvg[stop.iconKey as keyof typeof iconSvg] ?? iconSvg.pin}</div><div class="pin-label">${stop.kind === 'end' ? 'DESTINATION' : 'START'}<br/><b>${escapeHtml(stop.name)}</b></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function makeWaypointIcon(
  leaflet: LeafletModule,
  stop: PlanResult['stops'][number],
  selected: boolean,
) {
  const color = stop.color ?? PLAN_COLORS.start;
  return leaflet.divIcon({
    className: 'evagent-wp',
    html: `<div class="wp-halo${selected ? ' sel' : ''}" style="--c:${color}"></div><div class="wp-dot${selected ? ' sel' : ''}" style="--c:${color}">${iconSvg[stop.iconKey as keyof typeof iconSvg] ?? iconSvg.pin}</div><div class="wp-label">${escapeHtml(stop.shortName)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function toLatLngs(
  points: { lat: number; lng: number }[],
): Leaflet.LatLngTuple[] {
  return points.map((point) => [point.lat, point.lng]);
}
