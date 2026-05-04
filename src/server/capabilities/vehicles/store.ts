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
 * Writes: `completeOnboarding` inserts a row or **refreshes Fleet identity**
 * on conflict (re-onboarding) while preserving SOC prefs and overrides.
 * `upsertOverrides` only mutates the columns the caller asked for.
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
 * Insert the **Driver**'s vehicle row at the end of onboarding, or update
 * make/model/year/vin/`tesla_vehicle_id` when a row already exists (dashboard
 * **Re-run setup** keeps the row so the user is still "onboarded"). SOC targets
 * and overrides are not reset on conflict.
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
    .onConflict((oc) =>
      oc.column('userId').doUpdateSet({
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin ?? null,
        teslaVehicleId: input.teslaVehicleId ?? null,
        updatedAt: sql`now()`,
      }),
    )
    .execute();

  const row = await getVehicle(db, userId);
  if (!row) {
    throw new Error(
      'completeOnboarding: vehicle row missing after upsert; check FK or migrations',
    );
  }
  return row;
}

/** Maps each input override field to the corresponding `vehicles` column. */
const OVERRIDE_COLUMN_BY_FIELD = {
  usableRangeMiles: 'overrideUsableRangeMiles',
  batteryCapacityKWh: 'overrideBatteryCapacityKwh',
  consumptionWhPerMile: 'overrideConsumptionWhPerMile',
  connectorTypes: 'overrideConnectorTypes',
} as const satisfies Record<
  keyof NonNullable<UpsertOverridesInput['overrides']>,
  string
>;

function applyOverrideColumns(
  update: Record<string, unknown>,
  overrides: UpsertOverridesInput['overrides'],
): void {
  if (!overrides) return;
  for (const [field, column] of Object.entries(OVERRIDE_COLUMN_BY_FIELD)) {
    if (field in overrides) {
      update[column] = (overrides as Record<string, unknown>)[field] ?? null;
    }
  }
}

function applyPreferenceColumns(
  update: Record<string, unknown>,
  preferences: UpsertOverridesInput['preferences'],
): void {
  if (!preferences) return;
  if (typeof preferences.targetArrivalSocPercent === 'number') {
    update.targetArrivalSocPercent = preferences.targetArrivalSocPercent;
  }
  if (typeof preferences.postChargeSocPercent === 'number') {
    update.postChargeSocPercent = preferences.postChargeSocPercent;
  }
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
  applyOverrideColumns(update, input.overrides);
  applyPreferenceColumns(update, input.preferences);

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
