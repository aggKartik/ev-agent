import { type Kysely, sql } from 'kysely';
import type { Database } from '../types';

/**
 * Single table for every OAuth-linked remote account. `provider` is the
 * discriminator (e.g. 'tesla', 'rivian', 'smartcar'). A user may link at
 * most one account per provider — enforced by the composite unique index
 * on (provider, user_id).
 *
 * `user_id` is the internal FK to `users.id`. External identity providers
 * (Clerk, etc.) are resolved to an internal user before any OAuth row is
 * written, so nothing in this table is coupled to a specific auth vendor.
 *
 * Access + refresh tokens are stored as AES-256-GCM ciphertext, with the IV
 * and auth tag in sibling columns. The master key lives in env as
 * OAUTH_TOKEN_ENCRYPTION_KEY and is never stored here.
 */
export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('oauth_accounts')
    .addColumn('id', 'serial', (column) => column.primaryKey())
    .addColumn('provider', 'varchar(64)', (column) => column.notNull())
    .addColumn('user_id', 'integer', (column) =>
      column.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('remote_account_id', 'varchar(255)')
    .addColumn('access_token_ciphertext', 'bytea', (column) => column.notNull())
    .addColumn('access_token_iv', 'bytea', (column) => column.notNull())
    .addColumn('access_token_tag', 'bytea', (column) => column.notNull())
    .addColumn('refresh_token_ciphertext', 'bytea', (column) =>
      column.notNull(),
    )
    .addColumn('refresh_token_iv', 'bytea', (column) => column.notNull())
    .addColumn('refresh_token_tag', 'bytea', (column) => column.notNull())
    .addColumn('scope', 'text', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('oauth_accounts_provider_user_id_key')
    .on('oauth_accounts')
    .columns(['provider', 'user_id'])
    .unique()
    .execute();

  await db.schema
    .createIndex('oauth_accounts_user_id_idx')
    .on('oauth_accounts')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('oauth_accounts').ifExists().execute();
}
