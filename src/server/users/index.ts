import { clerkClient } from '@clerk/tanstack-react-start/server';
import type { Kysely } from 'kysely';
import type { Database } from '#/server/platform/db/types';

/**
 * User directory — **intentional barrel** (see AGENTS.md: prefer direct imports
 * unless a façade reduces churn). Re-exported helpers for Clerk linking and
 * profile fields; route guards may import `#/server/users/requireVehicle` alone.
 *
 * The `users` table is our internal source of truth; everything else (OAuth
 * accounts, vehicles, etc.) joins into `users.id`. External identity providers
 * (Clerk today, anything else tomorrow) resolve into a user row via helpers here.
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

  // `email` column has a UNIQUE constraint. Only include it in the INSERT
  // when no other user already owns it — otherwise the insert would throw
  // an unhandled unique-constraint violation (the `onConflict` clause only
  // covers `clerkUserId`).
  let insertEmail: string | undefined;
  if (email) {
    const linked = await db
      .updateTable('users')
      .set({ clerkUserId })
      .where('email', '=', email)
      .where('clerkUserId', 'is', null)
      .returning('id')
      .executeTakeFirst();

    if (linked) return { id: linked.id };

    const claimed = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (!claimed) insertEmail = email;
  }

  try {
    await db
      .insertInto('users')
      .values({
        clerkUserId,
        ...(insertEmail ? { email: insertEmail } : {}),
      })
      .onConflict((oc) => oc.column('clerkUserId').doNothing())
      .execute();
  } catch (err) {
    // Defensive backstop for the TOCTOU window between the `claimed`
    // SELECT above and this INSERT: a concurrent request may have just
    // inserted a row with the same email. Retry once without the email
    // so the Clerk user still gets an internal row.
    if (insertEmail && isUniqueEmailViolation(err)) {
      await db
        .insertInto('users')
        .values({ clerkUserId })
        .onConflict((oc) => oc.column('clerkUserId').doNothing())
        .execute();
    } else {
      throw err;
    }
  }

  const row = await db
    .selectFrom('users')
    .select('id')
    .where('clerkUserId', '=', clerkUserId)
    .executeTakeFirstOrThrow();

  return row;
}

/** Postgres unique-violation (SQLSTATE 23505) on the `users_email_key` index. */
function isUniqueEmailViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: unknown; constraint?: unknown; detail?: unknown };
  if (e.code !== '23505') return false;
  if (typeof e.constraint === 'string' && e.constraint.includes('email')) {
    return true;
  }
  if (typeof e.detail === 'string' && /\bemail\b/i.test(e.detail)) {
    return true;
  }
  return false;
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

/**
 * Clerk-sourced display name. Present for OAuth sign-ins (Google populates
 * first/last name); typically absent for email-code users. Used to prefill
 * the onboarding NAME step so the user doesn't have to retype what we already
 * know.
 */
export async function resolveClerkFirstName(
  clerkUserId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const first = user.firstName?.trim();
    if (first) return first;
    const full = user.fullName?.trim();
    if (full) return full.split(/\s+/)[0] ?? null;
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists the **Driver**'s chosen first name to Clerk profile (email-code
 * sign-ups arrive without OAuth-populated {@link resolveClerkFirstName}).
 */
export async function setClerkUserFirstName(
  clerkUserId: string,
  firstName: string,
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUser(clerkUserId, { firstName });
}
