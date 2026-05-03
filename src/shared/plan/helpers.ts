/**
 * Plan-feature helpers shared between server and client. Specifically:
 *   - `getPlanCatalog` and `suggestPlanAddresses` back the `plan.catalog` /
 *     `plan.suggestAddresses` tRPC procedures.
 *   - `resolvePlanCoordinate` is used by both client UI (route preview,
 *     map layers) and the server EV-routing capability.
 *
 * Pure functions over `MOCK_ADDRESSES` / `CAR_LOCATION`, no I/O.
 */

import type { Coordinate } from '#/lib/geoTypes';
import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
  PLAN_DEFAULT_STARTING_SOC_PERCENT,
  PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
  PLAN_DEFAULT_VEHICLE_LABEL,
} from '#/shared/plan/constants';
import type {
  EvConnectorSlug,
  PlanAddress,
  PlanCatalogResponse,
} from '#/shared/plan/contracts';
import {
  CAR_LOCATION,
  MOCK_ADDRESSES,
  PLAN_ACTIVITY_CATALOG,
  PLAN_DATE_OPTIONS,
} from '#/shared/plan/data';

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
    defaultVehicleLabel: PLAN_DEFAULT_VEHICLE_LABEL,
    defaultUsableRangeMiles: PLAN_DEFAULT_USABLE_RANGE_MILES,
    defaultStartingSocPercent: PLAN_DEFAULT_STARTING_SOC_PERCENT,
    defaultTargetArrivalSocPercent: PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
    defaultBatteryCapacityKWh: PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
    defaultConsumptionWhPerMile: PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
    defaultConnectorTypes: [
      ...PLAN_DEFAULT_CONNECTOR_TYPES,
    ] satisfies EvConnectorSlug[],
    defaultPostChargeSocPercent: PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
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

function toPlanAddress(address: (typeof MOCK_ADDRESSES)[number]): PlanAddress {
  return {
    full: address.full,
    primary: address.primary,
    secondary: address.secondary,
    coordinate: { lat: address.lat, lng: address.lng },
  };
}
