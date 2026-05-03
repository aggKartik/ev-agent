import { type Kysely, sql } from 'kysely';
import type { Database } from '../types';

/**
 * Persistent **Vehicle** row, 1:1 with `users`. The internal source of truth
 * for who-drives-what; live state (SOC, range, GPS) is never persisted here
 * — it is fetched on demand from Tesla and cached in-memory.
 *
 * Identity columns (`make`, `model`, `year`, `vin`, `tesla_vehicle_id`) are
 * Tesla-authoritative when the **Driver** has linked Tesla; manual entry
 * fills them otherwise. Catalog-derivable energy facts (kWh, Wh/mi, range,
 * connectors) are intentionally **not** stored — they're a pure function of
 * (make, model, year) via `vehicles/domain/catalog.ts`. The `override_*`
 * columns let a **Driver** clobber a catalog value (e.g. lower kWh on a
 * battery with degradation) and persist that override.
 *
 * `target_arrival_soc_percent` and `post_charge_soc_percent` are **Driver**
 * preferences expressed against this Vehicle; stored here because we have a
 * 1:1 cardinality and no separate `driver_preferences` table.
 */
export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('vehicles')
    .addColumn('id', 'serial', (column) => column.primaryKey())
    .addColumn('user_id', 'integer', (column) =>
      column.references('users.id').onDelete('cascade').notNull().unique(),
    )
    .addColumn('make', 'varchar(64)', (column) => column.notNull())
    .addColumn('model', 'varchar(64)', (column) => column.notNull())
    .addColumn('year', 'varchar(4)', (column) => column.notNull())
    .addColumn('vin', 'varchar(32)', (column) => column.unique())
    .addColumn('tesla_vehicle_id', 'varchar(64)')
    .addColumn('target_arrival_soc_percent', 'integer', (column) =>
      column.notNull(),
    )
    .addColumn('post_charge_soc_percent', 'integer', (column) =>
      column.notNull(),
    )
    .addColumn('override_usable_range_miles', 'real')
    .addColumn('override_battery_capacity_kwh', 'real')
    .addColumn('override_consumption_wh_per_mile', 'real')
    .addColumn('override_connector_types', 'jsonb')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('vehicles').ifExists().execute();
}
