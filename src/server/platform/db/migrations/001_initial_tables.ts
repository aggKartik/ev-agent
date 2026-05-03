import { type Kysely, sql } from 'kysely';
import type { Database } from '../types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (column) => column.primaryKey())
    .addColumn('email', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('first_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('last_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'timestamp', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

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

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('user_cars').ifExists().execute();
  await db.schema.dropTable('cars').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
