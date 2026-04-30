import type {
  Coordinate,
  PlanAddress,
  PlanCatalogResponse,
  PlanRequest,
  PlanResult,
  PlanStop,
} from './contracts';
import {
  CAR_LOCATION,
  MOCK_ADDRESSES,
  PLAN_ACTIVITY_CATALOG,
  PLAN_COLORS,
  PLAN_DATE_OPTIONS,
  PLANNING_PHASES,
} from './data';

const ACTIVITY_PLACES = {
  coffee: {
    name: 'Intelligentsia - Silver Lake',
    sub: 'Best cortado in the basin',
    shortName: 'INTELLIGENTSIA',
  },
  hike: {
    name: 'Gaviota Hot Springs Trail',
    sub: '2.5 mi loop, shaded',
    shortName: 'GAVIOTA TRAIL',
  },
  scenic: {
    name: 'Pinnacles Overlook',
    sub: 'Long view of the coast',
    shortName: 'PINNACLES',
  },
  diner: {
    name: 'Old Cayucos Tavern',
    sub: 'Diner, biscuits and gravy',
    shortName: 'CAYUCOS TAVERN',
  },
  thrift: {
    name: 'Salvation Mountain Detour',
    sub: 'Folk-art pilgrimage',
    shortName: 'SALVATION MTN',
  },
  brewery: {
    name: 'Figueroa Mtn Brewery',
    sub: 'Taproom, local IPAs',
    shortName: 'FIGUEROA BREW',
  },
  photo: {
    name: 'McWay Falls Vista',
    sub: 'Iconic waterfall shot',
    shortName: 'MCWAY FALLS',
  },
  beach: {
    name: 'Carmel Beach',
    sub: 'White sand, dog friendly',
    shortName: 'CARMEL BEACH',
  },
  tacos: {
    name: 'La Super-Rica Taqueria',
    sub: 'Julia Child favorite',
    shortName: 'LA SUPER-RICA',
  },
} as const;

export function getPlanCatalog(): PlanCatalogResponse {
  return {
    activities: PLAN_ACTIVITY_CATALOG,
    dateOptions: [...PLAN_DATE_OPTIONS],
    carLocation: {
      full: CAR_LOCATION.full,
      primary: CAR_LOCATION.primary,
      secondary: CAR_LOCATION.secondary,
      coordinate: { lat: CAR_LOCATION.lat, lng: CAR_LOCATION.lng },
    },
  };
}

export function suggestPlanAddresses(query = ''): PlanAddress[] {
  if (query.trim().length < 2) {
    return MOCK_ADDRESSES.slice(0, 5).map(toPlanAddress);
  }

  const parts = query.toLowerCase().split(/\s+/).filter(Boolean);

  return MOCK_ADDRESSES.map((address) => {
    const haystack = address.full.toLowerCase();
    let score = haystack.startsWith(query.toLowerCase()) ? 50 : 0;
    if (haystack.includes(query.toLowerCase())) score += 20;
    for (const part of parts) {
      if (haystack.includes(part)) score += 5;
    }
    return { address, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ address }) => toPlanAddress(address));
}

export function resolvePlanCoordinate(address: PlanAddress): Coordinate {
  if (address.coordinate) return address.coordinate;

  if (
    address.full === CAR_LOCATION.full ||
    address.full.toLowerCase().includes('current location')
  ) {
    return { lat: CAR_LOCATION.lat, lng: CAR_LOCATION.lng };
  }

  const hit = MOCK_ADDRESSES.find(
    (candidate) => candidate.full === address.full,
  );
  if (hit) return { lat: hit.lat, lng: hit.lng };

  let hash = 0;
  for (let index = 0; index < address.full.length; index += 1) {
    hash = (hash * 31 + address.full.charCodeAt(index)) | 0;
  }

  return {
    lat: 34 + Math.abs(hash % 600) / 100,
    lng: -122 + Math.abs((hash >> 8) % 400) / 100,
  };
}

export function cleanPlanAddress(value: string) {
  const parts = value.split(',');
  return parts.slice(0, 2).join(',').trim() || value;
}

export function formatPlanMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function createMockPlanResult(request: PlanRequest): PlanResult {
  const fromCoordinate = resolvePlanCoordinate(request.from);
  const toCoordinate = resolvePlanCoordinate(request.to);
  const stops = buildStops(request, fromCoordinate, toCoordinate);
  const geometry = stops.map((stop) => stop.coordinate);
  const totals = stops.reduce(
    (acc, stop) => ({
      miles: acc.miles + stop.miles,
      driveMinutes: acc.driveMinutes + stop.driveMinutes,
      dwellMinutes: acc.dwellMinutes + stop.dwellMinutes,
      chargeStops: acc.chargeStops + (stop.kind === 'charge' ? 1 : 0),
      activityStops: acc.activityStops + (stop.kind === 'activity' ? 1 : 0),
      arrivalTime: stop.arrivalTime,
    }),
    {
      miles: 0,
      driveMinutes: 0,
      dwellMinutes: 0,
      chargeStops: 0,
      activityStops: 0,
      arrivalTime: '08:42',
    },
  );

  return {
    id: `plan_${stableHash(JSON.stringify(request)).toString(36)}`,
    request,
    geometry,
    stops,
    totals,
    phases: PLANNING_PHASES,
  };
}

function buildStops(
  request: PlanRequest,
  fromCoordinate: Coordinate,
  toCoordinate: Coordinate,
) {
  const stops: PlanStop[] = [
    {
      id: 'start',
      kind: 'start',
      name: cleanPlanAddress(request.from.full),
      shortName: 'START',
      iconKey: 'crosshair',
      color: PLAN_COLORS.peach,
      coordinate: fromCoordinate,
      driveMinutes: 0,
      miles: 0,
      dwellMinutes: 0,
      arrivalTime: '08:42',
    },
  ];

  let elapsedMinutes = 8 * 60 + 42;
  request.activities.forEach((selection, index) => {
    const catalogItem = PLAN_ACTIVITY_CATALOG.find(
      (item) => item.id === selection.id,
    );
    if (!catalogItem) return;

    const place = ACTIVITY_PLACES[selection.id];
    const driveMinutes = 52 + index * 8;
    const miles = 38 + index * 12;
    elapsedMinutes += driveMinutes;

    stops.push({
      id: `act-${selection.id}-${index}`,
      kind: 'activity',
      name: place.name,
      sub: place.sub,
      shortName: place.shortName,
      detail: catalogItem.label,
      activityId: selection.id,
      iconKey: selection.id,
      color: catalogItem.color,
      coordinate: interpolateCoordinate(
        fromCoordinate,
        toCoordinate,
        stops.length,
        request.activities.length + 2,
      ),
      driveMinutes,
      miles,
      dwellMinutes: selection.dwellMinutes,
      arrivalTime: formatClock(elapsedMinutes),
    });

    elapsedMinutes += selection.dwellMinutes;

    if (index === 1 || index === 3) {
      const chargeDriveMinutes = 22;
      elapsedMinutes += chargeDriveMinutes;
      stops.push({
        id: `charge-${index}`,
        kind: 'charge',
        name: 'Electrify America - Gaviota',
        sub: '24 stalls, 350 kW, 18% to 82%',
        shortName: 'CHARGE - 22 MIN',
        detail: 'Fast charge, 350kW',
        iconKey: 'bolt',
        color: PLAN_COLORS.lime,
        coordinate: interpolateCoordinate(
          fromCoordinate,
          toCoordinate,
          stops.length,
          request.activities.length + 3,
        ),
        driveMinutes: chargeDriveMinutes,
        miles: 18,
        dwellMinutes: 22,
        arrivalTime: formatClock(elapsedMinutes),
      });
      elapsedMinutes += 22;
    }
  });

  elapsedMinutes += 60 + Math.floor(stops.length * 18);
  stops.push({
    id: 'end',
    kind: 'end',
    name: cleanPlanAddress(request.to.full),
    shortName: 'DESTINATION',
    iconKey: 'flag',
    color: PLAN_COLORS.magenta,
    coordinate: toCoordinate,
    driveMinutes: 60,
    miles: 48,
    dwellMinutes: 0,
    arrivalTime: formatClock(elapsedMinutes),
  });

  return stops;
}

function interpolateCoordinate(
  from: Coordinate,
  to: Coordinate,
  index: number,
  total: number,
): Coordinate {
  const ratio = index / total;
  const wobbleLat = Math.sin(index * 2.1) * 0.35;
  const wobbleLng = Math.cos(index * 1.7) * 0.5;

  return {
    lat: from.lat + (to.lat - from.lat) * ratio + wobbleLat,
    lng: from.lng + (to.lng - from.lng) * ratio + wobbleLng,
  };
}

function formatClock(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function stableHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return Math.abs(hash);
}

function toPlanAddress(address: (typeof MOCK_ADDRESSES)[number]): PlanAddress {
  return {
    full: address.full,
    primary: address.primary,
    secondary: address.secondary,
    coordinate: { lat: address.lat, lng: address.lng },
  };
}
