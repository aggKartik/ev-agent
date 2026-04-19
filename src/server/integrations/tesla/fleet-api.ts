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
  carType: string | null;
  trimBadging: string | null;
  odometerMi: number | null;
  batteryLevel: number | null;
  usableBatteryLevel: number | null;
  chargeLimitSoc: number | null;
  batteryRangeMi: number | null;
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

function mapVehicle(
  entry: VehicleDataEntry | VehicleListEntry,
): TeslaVehicleSummary {
  const full = entry as VehicleDataEntry;
  return {
    id: String(entry.id),
    vin: entry.vin ?? null,
    displayName: entry.display_name ?? null,
    state: entry.state ?? null,
    carType:
      typeof full.vehicle_config?.car_type === 'string'
        ? full.vehicle_config.car_type
        : null,
    trimBadging:
      typeof full.vehicle_config?.trim_badging === 'string'
        ? full.vehicle_config.trim_badging
        : null,
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
