import { tool } from 'ai';
import { z } from 'zod';
import { env } from '#/lib/env';
import type { PlanStreamEvent } from '#/shared/plan/contracts';

type Deps = {
  signal?: AbortSignal;
  emit?: (event: PlanStreamEvent) => void;
};

type OcmConnection = {
  PowerKW?: number | null;
  Quantity?: number | null;
};

type OcmStation = {
  AddressInfo?: {
    Title?: string;
    Latitude?: number;
    Longitude?: number;
  };
  OperatorInfo?: { Title?: string } | null;
  Connections?: OcmConnection[];
};

function formatCoordinate({ lat, lng }: { lat: number; lng: number }): string {
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

export function makeFindChargingStationsTool({ signal, emit }: Deps) {
  return tool({
    description:
      'Find DC fast-charging stations near a coordinate. Use this to insert charging stops along the route. Returns up to 20 stations with power, stall count, network, and coordinate.',
    inputSchema: z.object({
      near: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
      radiusMiles: z.number().min(1).max(100),
      minPowerKw: z
        .number()
        .min(0)
        .max(400)
        .optional()
        .describe('Minimum per-stall kW (e.g. 150 for fast chargers).'),
    }),
    execute: async ({ near, radiusMiles, minPowerKw }) => {
      emit?.({
        type: 'toolProgress',
        tool: 'findChargingStations',
        status: 'started',
        message: `Searching chargers near ${formatCoordinate(near)} within ${radiusMiles} mi${typeof minPowerKw === 'number' ? ` (≥${minPowerKw} kW)` : ''}.`,
      });

      try {
        const params = new URLSearchParams({
          output: 'json',
          latitude: String(near.lat),
          longitude: String(near.lng),
          distance: String(radiusMiles),
          distanceunit: 'Miles',
          maxresults: '20',
          compact: 'true',
          verbose: 'false',
        });
        const url = `https://api.openchargemap.io/v3/poi/?${params.toString()}`;
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (env.OPENCHARGEMAP_KEY) {
          headers['X-API-Key'] = env.OPENCHARGEMAP_KEY;
        }

        const response = await fetch(url, { headers, signal });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(
            `OpenChargeMap request failed (${response.status}): ${body.slice(0, 200)}`,
          );
        }

        const raw = (await response.json()) as unknown;
        if (!Array.isArray(raw)) {
          throw new Error('OpenChargeMap returned a non-array payload');
        }

        const stations = (raw as OcmStation[])
          .map((station) => {
            const lat = station.AddressInfo?.Latitude;
            const lng = station.AddressInfo?.Longitude;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            const connections = Array.isArray(station.Connections)
              ? station.Connections
              : [];
            const powerKw = connections.reduce((max, conn) => {
              const kw = typeof conn.PowerKW === 'number' ? conn.PowerKW : 0;
              return kw > max ? kw : max;
            }, 0);
            if (typeof minPowerKw === 'number' && powerKw < minPowerKw) {
              return null;
            }
            const stalls = connections.reduce((sum, conn) => {
              const qty = typeof conn.Quantity === 'number' ? conn.Quantity : 0;
              return sum + qty;
            }, 0);
            const name = station.AddressInfo?.Title ?? 'Charging station';
            const network = station.OperatorInfo?.Title ?? 'Unknown network';
            return {
              name,
              network,
              powerKw,
              stalls,
              coordinate: { lat, lng },
            };
          })
          .filter((s): s is NonNullable<typeof s> => s !== null);

        const highPowerCount = stations.filter(
          (station) => station.powerKw >= 120,
        ).length;
        emit?.({
          type: 'toolProgress',
          tool: 'findChargingStations',
          status: 'completed',
          message: `Found ${stations.length} charger candidate${stations.length === 1 ? '' : 's'} (${highPowerCount} DCFC-capable).`,
        });

        return { stations };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Charging search failed.';
        emit?.({
          type: 'toolProgress',
          tool: 'findChargingStations',
          status: 'failed',
          message: `Charging search failed near ${formatCoordinate(near)}: ${message}`,
        });
        throw error;
      }
    },
  });
}
