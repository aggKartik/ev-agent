import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import { decodeTeslaVin } from '#/server/integrations/tesla/vehicle/vin';
import type { CompleteOnboardingInput } from '#/shared/vehicles/contracts';

/**
 * Maps a Fleet API vehicle row into the onboarding prefill payload
 * ({@link TeslaVehicleSummary}) for UI hints. Model/year come from local VIN
 * decode — no extra Fleet endpoints.
 */
export function teslaPrefillVehicleFromFleetSummary(
  target: TeslaVehicleSummary,
): {
  id: string;
  vin: string | null;
  displayName: string | null;
  make: 'Tesla';
  model: string | null;
  year: string | null;
} {
  const decoded = decodeTeslaVin(target.vin);
  return {
    id: target.id,
    vin: target.vin,
    displayName: target.displayName,
    make: 'Tesla',
    model: decoded.model,
    year: decoded.year,
  };
}

function normalizeVin(vin: string | null | undefined): string | undefined {
  if (typeof vin !== 'string') return undefined;
  const trimmed = vin.trim().toUpperCase();
  return trimmed.length >= 11 ? trimmed : undefined;
}

/**
 * When VIN decoding yields catalog-ready model + year, returns input for DB
 * `completeOnboarding`. Otherwise `null` — never guess fake identity.
 */
export function completeOnboardingInputFromFleetSummary(
  target: TeslaVehicleSummary,
): CompleteOnboardingInput | null {
  const decoded = decodeTeslaVin(target.vin);
  const model = decoded.model?.trim();
  const year = decoded.year;
  if (
    !model ||
    typeof year !== 'string' ||
    !/^\d{4}$/.test(year.trim()) ||
    !Number.isFinite(Number(year))
  ) {
    return null;
  }
  const vinNorm = normalizeVin(target.vin);
  return {
    make: 'Tesla',
    model,
    year: year.trim(),
    ...(vinNorm ? { vin: vinNorm } : {}),
    teslaVehicleId: String(target.id),
  };
}
