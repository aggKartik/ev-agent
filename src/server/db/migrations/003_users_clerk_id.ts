import type { Kysely } from 'kysely';
import type { Database } from '../types';

/**
 * Make the `users` table the internal source of truth for all user rows,
 * decoupled from any one identity provider. Adds `clerk_user_id` (unique),
 * and drops the historical NOT NULL on email / first_name / last_name so
 * that a user can be lazily provisioned on first authenticated request
 * before we've fetched their profile from Clerk.
 */
export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('clerk_user_id', 'varchar(255)')
    .execute();

  await db.schema
    .createIndex('users_clerk_user_id_key')
    .on('users')
    .column('clerk_user_id')
    .unique()
    .execute();

  await db.schema
    .alterTable('users')
    .alterColumn('email', (ac) => ac.dropNotNull())
    .alterColumn('first_name', (ac) => ac.dropNotNull())
    .alterColumn('last_name', (ac) => ac.dropNotNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .alterColumn('email', (ac) => ac.setNotNull())
    .alterColumn('first_name', (ac) => ac.setNotNull())
    .alterColumn('last_name', (ac) => ac.setNotNull())
    .execute();
  await db.schema.dropIndex('users_clerk_user_id_key').execute();
  await db.schema.alterTable('users').dropColumn('clerk_user_id').execute();
}
