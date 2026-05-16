import { tool } from 'ai';
import { z } from 'zod';
import { env } from '#/lib/env';
import type { PlanStreamEvent } from '#/shared/plan/contracts';
import { emitPlanToolProgress } from './toolProgress';

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

type Station = {
  name: string;
  network: string;
  powerKw: number;
  stalls: number;
  coordinate: { lat: number; lng: number };
};

type ChargingSearchInput = {
  near: { lat: number; lng: number };
  radiusMiles: number;
  minPowerKw?: number;
};

function formatCoordinate({ lat, lng }: { lat: number; lng: number }): string {
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

function buildOpenChargeMapRequest({
  near,
  radiusMiles,
}: ChargingSearchInput): { url: string; headers: Record<string, string> } {
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
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (env.OPENCHARGEMAP_KEY) headers['X-API-Key'] = env.OPENCHARGEMAP_KEY;
  return {
    url: `https://api.openchargemap.io/v3/poi/?${params.toString()}`,
    headers,
  };
}

function maxConnectionPower(connections: OcmConnection[]): number {
  return connections.reduce((max, conn) => {
    const kw = typeof conn.PowerKW === 'number' ? conn.PowerKW : 0;
    return Math.max(max, kw);
  }, 0);
}

function totalConnectionStalls(connections: OcmConnection[]): number {
  return connections.reduce((sum, conn) => {
    const qty = typeof conn.Quantity === 'number' ? conn.Quantity : 0;
    return sum + qty;
  }, 0);
}

function stationCoordinate(station: OcmStation) {
  const lat = station.AddressInfo?.Latitude;
  const lng = station.AddressInfo?.Longitude;
  return typeof lat === 'number' && typeof lng === 'number'
    ? { lat, lng }
    : null;
}

function stationConnections(station: OcmStation): OcmConnection[] {
  return Array.isArray(station.Connections) ? station.Connections : [];
}

function failsPowerFilter(
  powerKw: number,
  minPowerKw: number | undefined,
): boolean {
  return typeof minPowerKw === 'number' && powerKw < minPowerKw;
}

function buildStationCandidate(
  station: OcmStation,
  coordinate: Station['coordinate'],
  connections: OcmConnection[],
): Station {
  return {
    name: station.AddressInfo?.Title ?? 'Charging station',
    network: station.OperatorInfo?.Title ?? 'Unknown network',
    powerKw: maxConnectionPower(connections),
    stalls: totalConnectionStalls(connections),
    coordinate,
  };
}

function stationToCandidate(
  station: OcmStation,
  minPowerKw: number | undefined,
): Station | null {
  const coordinate = stationCoordinate(station);
  if (!coordinate) return null;
  const connections = stationConnections(station);
  const candidate = buildStationCandidate(station, coordinate, connections);
  return failsPowerFilter(candidate.powerKw, minPowerKw) ? null : candidate;
}

function parseStations(
  raw: unknown,
  minPowerKw: number | undefined,
): Station[] {
  if (!Array.isArray(raw)) {
    throw new Error('OpenChargeMap returned a non-array payload');
  }
  return raw
    .map((station) => stationToCandidate(station as OcmStation, minPowerKw))
    .filter((station): station is Station => station !== null);
}

async function readOpenChargeMapStations(
  input: ChargingSearchInput,
  signal?: AbortSignal,
): Promise<Station[]> {
  const { url, headers } = buildOpenChargeMapRequest(input);
  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `OpenChargeMap request failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }
  return parseStations(await response.json(), input.minPowerKw);
}

function startedMessage({
  near,
  radiusMiles,
  minPowerKw,
}: ChargingSearchInput): string {
  const power = typeof minPowerKw === 'number' ? ` (≥${minPowerKw} kW)` : '';
  return `Searching chargers near ${formatCoordinate(near)} within ${radiusMiles} mi${power}.`;
}

function completedMessage(stations: Station[]): string {
  const highPowerCount = stations.filter(
    (station) => station.powerKw >= 120,
  ).length;
  const plural = stations.length === 1 ? '' : 's';
  return `Found ${stations.length} charger candidate${plural} (${highPowerCount} DCFC-capable).`;
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
    execute: async (input) => {
      emitPlanToolProgress(
        emit,
        'findChargingStations',
        'started',
        startedMessage(input),
      );
      try {
        const stations = await readOpenChargeMapStations(input, signal);
        emitPlanToolProgress(
          emit,
          'findChargingStations',
          'completed',
          completedMessage(stations),
        );
        return { stations };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Charging search failed.';
        emitPlanToolProgress(
          emit,
          'findChargingStations',
          'failed',
          `Charging search failed near ${formatCoordinate(input.near)}: ${message}`,
        );
        throw error;
      }
    },
  });
}
