import { useCallback } from 'react';
import { trpc } from '#/lib/trpc';
import type { EvConnectorSlug, PlanRequest } from '#/shared/plan/contracts';
import type {
  VehicleEnergyProfile,
  VehicleOverrides,
} from '#/shared/vehicles/contracts';

/**
 * Single-purpose hook: persist any **Driver Override** that diverges from
 * the resolved **Energy Profile** they're submitting against. Fire-and-
 * forget; we don't block the plan stream on the upsert.
 *
 * The diff is intentionally done in the client because the server already
 * persisted the catalog math via `plan.context`; resending overrides
 * unchanged would just churn `updated_at`. Real divergence (kWh changed,
 * connector toggled) gets a single `vehicle.upsertOverrides` call.
 */
export function usePersistVehicleOverrides(
  profile: VehicleEnergyProfile | null,
) {
  const upsert = trpc.vehicle.upsertOverrides.useMutation();

  return useCallback(
    (request: PlanRequest) => {
      if (!profile) return;
      const overrides = computeOverrides(profile, request);
      const preferences = computePreferenceDelta(profile, request);
      const hasOverrideUpdate = Object.values(overrides).some(
        (v) => v !== undefined,
      );
      const hasPreferenceUpdate = Object.values(preferences).some(
        (v) => v !== undefined,
      );
      if (!hasOverrideUpdate && !hasPreferenceUpdate) return;
      upsert.mutate({
        overrides: hasOverrideUpdate ? overrides : undefined,
        preferences: hasPreferenceUpdate ? preferences : undefined,
      });
    },
    [profile, upsert],
  );
}

function computeOverrides(
  profile: VehicleEnergyProfile,
  request: PlanRequest,
): VehicleOverrides {
  return {
    usableRangeMiles: numericOverride(
      request.usableRangeMiles,
      profile.usableRangeMiles,
    ),
    batteryCapacityKWh: numericOverride(
      request.batteryCapacityKWh,
      profile.batteryCapacityKWh,
    ),
    consumptionWhPerMile: numericOverride(
      request.consumptionWhPerMile,
      profile.consumptionWhPerMile,
    ),
    connectorTypes: connectorOverride(
      request.connectorTypes,
      profile.connectorTypes,
    ),
  };
}

function computePreferenceDelta(
  profile: VehicleEnergyProfile,
  request: PlanRequest,
): { targetArrivalSocPercent?: number; postChargeSocPercent?: number } {
  const out: {
    targetArrivalSocPercent?: number;
    postChargeSocPercent?: number;
  } = {};
  if (
    request.targetArrivalSocPercent !==
    profile.preferences.targetArrivalSocPercent
  ) {
    out.targetArrivalSocPercent = request.targetArrivalSocPercent;
  }
  if (
    request.postChargeSocPercent !== profile.preferences.postChargeSocPercent
  ) {
    out.postChargeSocPercent = request.postChargeSocPercent;
  }
  return out;
}

function numericOverride(
  value: number,
  resolved: number,
): number | null | undefined {
  if (Math.abs(value - resolved) < 0.5) return undefined;
  return value;
}

function connectorOverride(
  value: EvConnectorSlug[],
  resolved: EvConnectorSlug[],
): EvConnectorSlug[] | null | undefined {
  if (value.length !== resolved.length) return value;
  const set = new Set(resolved);
  if (value.every((slug) => set.has(slug))) return undefined;
  return value;
}
