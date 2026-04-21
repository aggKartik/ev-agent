import { clerkClient } from '@clerk/tanstack-react-start/server';
import type { Kysely } from 'kysely';
import type { Database } from '#/server/db/types';

/**
 * User directory. The `users` table is our internal source of truth;
 * everything else (OAuth accounts, cars, etc.) joins into `users.id`.
 * External identity providers (Clerk today, anything else tomorrow) are resolved
 * into a user row via helpers in this module.
 */

/**
 * Look up the internal user for a given Clerk user id. If no row exists yet,
 * tries to attach `clerkUserId` to an existing row matched by email (when
 * `resolveEmail` returns a primary email). Otherwise inserts a new row.
 * Race-safe for concurrent first requests.
 */
export async function getOrLinkUserByClerkId(
  db: Kysely<Database>,
  clerkUserId: string,
  resolveEmail: () => Promise<string | null>,
): Promise<{ id: number }> {
  const existing = await db
    .selectFrom('users')
    .select('id')
    .where('clerkUserId', '=', clerkUserId)
    .executeTakeFirst();

  if (existing) return existing;

  const email = await resolveEmail();

  if (email) {
    const linked = await db
      .updateTable('users')
      .set({ clerkUserId })
      .where('email', '=', email)
      .where('clerkUserId', 'is', null)
      .returning('id')
      .executeTakeFirst();

    if (linked) return { id: linked.id };
  }

  await db
    .insertInto('users')
    .values({
      clerkUserId,
      ...(email ? { email } : {}),
    })
    .onConflict((oc) => oc.column('clerkUserId').doNothing())
    .execute();

  const row = await db
    .selectFrom('users')
    .select('id')
    .where('clerkUserId', '=', clerkUserId)
    .executeTakeFirstOrThrow();

  return row;
}

/**
 * @deprecated Prefer {@link getOrLinkUserByClerkId} with a Clerk email resolver.
 * Retained for call sites that cannot resolve email (tests / scripts).
 */
export async function getOrCreateUserByClerkId(
  db: Kysely<Database>,
  clerkUserId: string,
): Promise<{ id: number }> {
  return getOrLinkUserByClerkId(db, clerkUserId, async () => null);
}

/** Primary email from Clerk (for linking pre-existing users by email). */
export async function resolveClerkPrimaryEmail(
  clerkUserId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const primaryId = user.primaryEmailAddressId;
    if (primaryId) {
      const match = user.emailAddresses.find((e) => e.id === primaryId);
      if (match) return match.emailAddress;
    }
    return user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}
