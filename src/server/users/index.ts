import type { Kysely } from 'kysely';
import type { Database } from '#/server/db/types';

/**
 * User directory. The `users` table is our internal source of truth;
 * everything else (OAuth accounts, cars, etc.) joins into `users.id`.
 * External identity providers (Clerk today) are resolved into a user row
 * via helpers in this module.
 */

/**
 * Look up the internal user for a given Clerk user id, creating the row
 * lazily on first authenticated request. Race-safe: concurrent callers
 * land on the same row via `ON CONFLICT DO NOTHING` + a follow-up select.
 */
export async function getOrCreateUserByClerkId(
  db: Kysely<Database>,
  clerkUserId: string,
): Promise<{ id: number }> {
  const existing = await db
    .selectFrom('users')
    .select('id')
    .where('clerkUserId', '=', clerkUserId)
    .executeTakeFirst();

  if (existing) return existing;

  await db
    .insertInto('users')
    .values({ clerkUserId })
    .onConflict((oc) => oc.column('clerkUserId').doNothing())
    .execute();

  const row = await db
    .selectFrom('users')
    .select('id')
    .where('clerkUserId', '=', clerkUserId)
    .executeTakeFirstOrThrow();

  return row;
}
