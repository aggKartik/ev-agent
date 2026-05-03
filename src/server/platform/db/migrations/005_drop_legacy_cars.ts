import { type Kysely, sql } from 'kysely';
import type { Database } from '../types';

/**
 * The legacy `cars` / `user_cars` tables from migration 001 were never
 * written to by any code path. The new `vehicles` table (migration 004)
 * supersedes them with a 1:1-to-user shape that matches how the product
 * actually works.
 *
 * `down` recreates the original schema verbatim (matches 001) so the
 * migration is reversible end-to-end.
 */
export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('user_cars').ifExists().execute();
  await db.schema.dropTable('cars').ifExists().execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('cars')
    .addColumn('id', 'serial', (column) => column.primaryKey())
    .addColumn('make', 'varchar(255)', (column) => column.notNull())
    .addColumn('model', 'varchar(255)', (column) => column.notNull())
    .addColumn('year', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'timestamp', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('user_cars')
    .addColumn('user_id', 'integer', (column) =>
      column.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('car_id', 'integer', (column) =>
      column.references('cars.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamp', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('user_cars_pkey', ['user_id', 'car_id'])
    .execute();
}
