import { OAuthError } from '#/server/oauth/errors';
import { type TeslaRegion, teslaFleetBaseUrl } from '../config';

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
  drive_state?: {
    latitude?: number;
    longitude?: number;
    /** Tesla returns seconds since epoch. */
    gps_as_of?: number;
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
  /** Last known GPS coordinate; null when the vehicle is asleep or has not reported. */
  latitude: number | null;
  longitude: number | null;
  /** ISO timestamp the GPS fix was reported. */
  gpsAsOf: string | null;
};

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

/**
 * `vehicle_data` returns 408 / "vehicle unavailable" when the car is asleep or
 * otherwise not reachable. Only those cases should fall back to the list-row
 * summary — auth and server errors must propagate.
 */
export function isPerVehicleUnavailableFleetError(err: unknown): boolean {
  if (!(err instanceof OAuthError)) return false;
  const code = err.code.toLowerCase();
  const msg = err.message.toLowerCase();
  if (code === 'http_408') return true;
  if (
    code.includes('vehicle_unavailable') ||
    code.includes('vehicle unavailable') ||
    code.includes('device_communication_timeout')
  ) {
    return true;
  }
  if (
    msg.includes('vehicle unavailable') ||
    msg.includes('device not available') ||
    msg.includes('vehicle is offline')
  ) {
    return true;
  }
  return false;
}

function mapVehicle(
  entry: VehicleDataEntry | VehicleListEntry,
): TeslaVehicleSummary {
  const full = entry as VehicleDataEntry;
  const latitude =
    typeof full.drive_state?.latitude === 'number'
      ? full.drive_state.latitude
      : null;
  const longitude =
    typeof full.drive_state?.longitude === 'number'
      ? full.drive_state.longitude
      : null;
  const gpsAsOf =
    typeof full.drive_state?.gps_as_of === 'number'
      ? new Date(full.drive_state.gps_as_of * 1000).toISOString()
      : null;
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
    latitude,
    longitude,
    gpsAsOf,
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
  // them and let the user pick. `drive_state` is included here so the plan
  // form's START field can use the car's GPS fix when the vehicle is awake;
  // sleeping vehicles will simply yield `latitude: null`.
  return Promise.all(
    list.map(async (v) => {
      try {
        const data = await fleetFetch<VehicleDataEntry>(
          args.accessToken,
          args.region,
          `/api/1/vehicles/${v.id}/vehicle_data?endpoints=${encodeURIComponent(
            'vehicle_state;charge_state;drive_state',
          )}`,
        );
        return mapVehicle(data);
      } catch (err) {
        if (isPerVehicleUnavailableFleetError(err)) {
          return mapVehicle(v);
        }
        throw err;
      }
    }),
  );
}
