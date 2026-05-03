import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '#/server/platform/db/types';
import {
  PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
  PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
} from '#/shared/plan/constants';
import type {
  CompleteOnboardingInput,
  UpsertOverridesInput,
} from '#/shared/vehicles/contracts';
import type { VehicleRow } from './domain/types';

/**
 * The only module that touches the `vehicles` table directly. Mirrors the
 * shape of `oauth/store.ts`: callers (the tRPC router, the redirect-gate
 * helper) hit named functions, not raw queries.
 *
 * Reads return a normalized `VehicleRow` (no Kysely types leak out).
 * Writes are idempotent — `completeOnboarding` will not clobber an existing
 * row, and `upsertOverrides` only mutates the columns the caller asked for.
 */

const VEHICLE_COLUMNS = [
  'id',
  'userId',
  'make',
  'model',
  'year',
  'vin',
  'teslaVehicleId',
  'targetArrivalSocPercent',
  'postChargeSocPercent',
  'overrideUsableRangeMiles',
  'overrideBatteryCapacityKwh',
  'overrideConsumptionWhPerMile',
  'overrideConnectorTypes',
] as const;

export async function getVehicle(
  db: Kysely<Database>,
  userId: number,
): Promise<VehicleRow | null> {
  const row = await db
    .selectFrom('vehicles')
    .select([...VEHICLE_COLUMNS])
    .where('userId', '=', userId)
    .executeTakeFirst();
  return row ?? null;
}

export async function hasVehicle(
  db: Kysely<Database>,
  userId: number,
): Promise<boolean> {
  const row = await db
    .selectFrom('vehicles')
    .select('id')
    .where('userId', '=', userId)
    .executeTakeFirst();
  return row !== undefined;
}

/**
 * Insert the **Driver**'s vehicle row at the end of onboarding. Idempotent
 * via `ON CONFLICT (user_id) DO NOTHING` so a double-submit can't create a
 * second row or wipe driver-tunable preferences. Returns the row currently
 * persisted for the user, even if a concurrent request beat us to it.
 */
export async function completeOnboarding(
  db: Kysely<Database>,
  userId: number,
  input: CompleteOnboardingInput,
): Promise<VehicleRow> {
  await db
    .insertInto('vehicles')
    .values({
      userId,
      make: input.make,
      model: input.model,
      year: input.year,
      vin: input.vin ?? null,
      teslaVehicleId: input.teslaVehicleId ?? null,
      targetArrivalSocPercent: PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
      postChargeSocPercent: PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
      overrideUsableRangeMiles: null,
      overrideBatteryCapacityKwh: null,
      overrideConsumptionWhPerMile: null,
      overrideConnectorTypes: null,
    })
    .onConflict((oc) => oc.column('userId').doNothing())
    .execute();

  const row = await getVehicle(db, userId);
  if (!row) {
    throw new Error(
      'completeOnboarding: vehicle row missing after upsert; check FK or migrations',
    );
  }
  return row;
}

/**
 * Apply a partial set of overrides + preferences. `null` clears an override
 * (caller should set it explicitly when the form value matches the catalog
 * — see `domain/diffOverrides.ts`).
 */
export async function upsertOverrides(
  db: Kysely<Database>,
  userId: number,
  input: UpsertOverridesInput,
): Promise<VehicleRow | null> {
  const update: Record<string, unknown> = { updatedAt: sql`now()` };

  if (input.overrides) {
    if ('usableRangeMiles' in input.overrides) {
      update.overrideUsableRangeMiles =
        input.overrides.usableRangeMiles ?? null;
    }
    if ('batteryCapacityKWh' in input.overrides) {
      update.overrideBatteryCapacityKwh =
        input.overrides.batteryCapacityKWh ?? null;
    }
    if ('consumptionWhPerMile' in input.overrides) {
      update.overrideConsumptionWhPerMile =
        input.overrides.consumptionWhPerMile ?? null;
    }
    if ('connectorTypes' in input.overrides) {
      update.overrideConnectorTypes = input.overrides.connectorTypes ?? null;
    }
  }

  if (input.preferences) {
    if (typeof input.preferences.targetArrivalSocPercent === 'number') {
      update.targetArrivalSocPercent =
        input.preferences.targetArrivalSocPercent;
    }
    if (typeof input.preferences.postChargeSocPercent === 'number') {
      update.postChargeSocPercent = input.preferences.postChargeSocPercent;
    }
  }

  // No fields actually changed (caller passed an empty diff) — short-circuit
  // so we don't bump `updatedAt` for nothing.
  if (Object.keys(update).length === 1) {
    return getVehicle(db, userId);
  }

  await db
    .updateTable('vehicles')
    .set(update)
    .where('userId', '=', userId)
    .execute();

  return getVehicle(db, userId);
}

/**
 * Hard-delete the vehicle row. Used by `/onboarding?force=1` so re-running
 * setup starts from a clean slate. OAuth links survive (they live on
 * `oauth_accounts` keyed by `userId`, not on the vehicle).
 */
export async function deleteVehicle(
  db: Kysely<Database>,
  userId: number,
): Promise<void> {
  await db.deleteFrom('vehicles').where('userId', '=', userId).execute();
}
