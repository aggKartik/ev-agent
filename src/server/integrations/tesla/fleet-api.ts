import { OAuthError } from '#/server/oauth/errors';
import { type TeslaRegion, teslaFleetBaseUrl } from './config';

/**
 * Tesla Fleet API typed client. Pure function: takes an access token +
 * region, returns decoded vehicle summaries. No DB, no token management —
 * callers fetch the access token via `getFreshAccessToken(db, teslaProvider, userId)`.
 */

type VehicleListEntry = {
  id: number;
  vehicle_id?: number;
  vin?: string;
  display_name?: string;
  state?: string;
};

type VehicleDataEntry = {
  id: number;
  vin?: string;
  display_name?: string;
  state?: string;
  vehicle_state?: { odometer?: number };
  charge_state?: {
    battery_level?: number;
    usable_battery_level?: number;
    charge_limit_soc?: number;
    battery_range?: number;
  };
  vehicle_config?: {
    car_type?: string;
    trim_badging?: string;
  };
};

type FleetApiResponse<T> = {
  response?: T;
  error?: string;
  error_description?: string;
};

export type TeslaVehicleSummary = {
  id: string;
  vin: string | null;
  displayName: string | null;
  state: string | null;
  odometerMi: number | null;
  batteryLevel: number | null;
  usableBatteryLevel: number | null;
  chargeLimitSoc: number | null;
  batteryRangeMi: number | null;
  /** Manufacturer; always "Tesla" when linked via the Tesla provider. */
  make: string;
  /**
   * Model derived from `vehicle_config.car_type` (the Fleet API field that
   * carries the model enum) with a VIN position-4 fallback for offline
   * vehicles that only expose the cached list entry. Null when nothing
   * decodes to a recognized model.
   */
  model: string | null;
  /**
   * Model year decoded from VIN position 10. The Fleet API does not
   * currently return the year directly, so we rely on VIN decoding — see
   * `VIN_YEAR_MAP` below. Null when the VIN is missing or unrecognized.
   */
  year: number | null;
};

/**
 * Fleet API `vehicle_config.car_type` values observed in production. Maps to
 * the display labels used in the onboarding MAKE/MODEL pickers so a
 * Tesla-linked user sees the same label they would have selected manually.
 *
 * See: https://developer.tesla.com/docs/fleet-api/fleet-telemetry/available-data
 * (Vehicle Configuration → `car_type` enum).
 */
const CAR_TYPE_MODEL_MAP: Record<string, string> = {
  models: 'Model S',
  models2: 'Model S',
  modelx: 'Model X',
  model3: 'Model 3',
  modely: 'Model Y',
  cybertruck: 'Cybertruck',
  truck: 'Cybertruck',
  roadster: 'Roadster',
  semi: 'Semi',
};

/**
 * VIN position 4 encodes the Tesla model family. This is the fallback when
 * `vehicle_config.car_type` isn't populated (e.g. an offline vehicle that
 * only returns the cached list entry).
 *
 * See: https://service.tesla.com/docs/Factory/VINDecoder
 */
const VIN_MODEL_MAP: Record<string, string> = {
  S: 'Model S',
  X: 'Model X',
  '3': 'Model 3',
  Y: 'Model Y',
  C: 'Cybertruck',
  R: 'Roadster',
  T: 'Semi',
};

/**
 * VIN position 10 is the model-year code. The Fleet API does not currently
 * expose a dedicated model-year field on `vehicle_data` — the Tesla team
 * declined to add one and the community-recommended approach is to decode
 * the VIN, which every vehicle_data + vehicle list response already carries.
 *
 * Tesla has been in production since 2008 (code "8"), and the NHTSA spec
 * wraps through the alphabet skipping I/O/Q/U/Z. We populate through 2030
 * which is more than enough for any car that could plausibly be linked
 * today.
 *
 * See: https://github.com/teslamotors/vehicle-command/issues/135
 *      https://service.tesla.com/docs/Factory/VINDecoder
 */
const VIN_YEAR_MAP: Record<string, number> = {
  '8': 2008,
  '9': 2009,
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
  Y: 2030,
};

function decodeTeslaModel(
  entry: VehicleDataEntry | VehicleListEntry,
): string | null {
  const full = entry as VehicleDataEntry;
  const carType = full.vehicle_config?.car_type?.toLowerCase();
  if (carType && CAR_TYPE_MODEL_MAP[carType]) {
    return CAR_TYPE_MODEL_MAP[carType];
  }
  const vin = entry.vin;
  if (vin && vin.length >= 4) {
    const code = vin.charAt(3).toUpperCase();
    return VIN_MODEL_MAP[code] ?? null;
  }
  return null;
}

function decodeTeslaYear(vin: string | undefined): number | null {
  if (!vin || vin.length < 10) return null;
  const code = vin.charAt(9).toUpperCase();
  return VIN_YEAR_MAP[code] ?? null;
}

async function fleetFetch<T>(
  accessToken: string,
  region: TeslaRegion,
  path: string,
): Promise<T> {
  const res = await fetch(`${teslaFleetBaseUrl(region)}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  const text = await res.text();
  let body: FleetApiResponse<T>;
  try {
    body = JSON.parse(text) as FleetApiResponse<T>;
  } catch {
    throw new OAuthError(
      'invalid_fleet_response',
      `Fleet API returned non-JSON body (status ${res.status}).`,
    );
  }

  if (!res.ok || typeof body.error === 'string') {
    const code =
      typeof body.error === 'string' ? body.error : `http_${res.status}`;
    const detail =
      typeof body.error_description === 'string'
        ? body.error_description
        : `Fleet API responded ${res.status}.`;
    throw new OAuthError(code, detail);
  }

  if (body.response === undefined) {
    throw new OAuthError(
      'invalid_fleet_response',
      'Fleet API response was missing the `response` field.',
    );
  }

  return body.response;
}

function mapVehicle(
  entry: VehicleDataEntry | VehicleListEntry,
): TeslaVehicleSummary {
  const full = entry as VehicleDataEntry;
  return {
    id: String(entry.id),
    vin: entry.vin ?? null,
    displayName: entry.display_name ?? null,
    state: entry.state ?? null,
    odometerMi:
      typeof full.vehicle_state?.odometer === 'number'
        ? full.vehicle_state.odometer
        : null,
    batteryLevel:
      typeof full.charge_state?.battery_level === 'number'
        ? full.charge_state.battery_level
        : null,
    usableBatteryLevel:
      typeof full.charge_state?.usable_battery_level === 'number'
        ? full.charge_state.usable_battery_level
        : null,
    chargeLimitSoc:
      typeof full.charge_state?.charge_limit_soc === 'number'
        ? full.charge_state.charge_limit_soc
        : null,
    batteryRangeMi:
      typeof full.charge_state?.battery_range === 'number'
        ? full.charge_state.battery_range
        : null,
    make: 'Tesla',
    model: decodeTeslaModel(entry),
    year: decodeTeslaYear(entry.vin),
  };
}

export async function fetchVehiclesWithState(args: {
  accessToken: string;
  region: TeslaRegion;
}): Promise<TeslaVehicleSummary[]> {
  const list = await fleetFetch<VehicleListEntry[]>(
    args.accessToken,
    args.region,
    '/api/1/vehicles',
  );

  // Fetch per-vehicle data in parallel; offline vehicles return an error we
  // downgrade to null-filled summaries so the onboarding UI can still render
  // them and let the user pick.
  return Promise.all(
    list.map(async (v) => {
      try {
        const data = await fleetFetch<VehicleDataEntry>(
          args.accessToken,
          args.region,
          `/api/1/vehicles/${v.id}/vehicle_data?endpoints=${encodeURIComponent(
            'vehicle_state;charge_state;vehicle_config',
          )}`,
        );
        return mapVehicle(data);
      } catch {
        return mapVehicle(v);
      }
    }),
  );
}
