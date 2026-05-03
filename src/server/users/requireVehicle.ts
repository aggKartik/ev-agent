import { hasVehicle } from '#/server/capabilities/vehicles/store';
import { db } from '#/server/platform/db';
import { getOrLinkUserByClerkId, resolveClerkPrimaryEmail } from './index';

/**
 * Server-fn-callable predicate behind the redirect gates on `/dashboard`,
 * `/plan`, and `/onboarding`. Resolves the internal user id (provisioning
 * lazily on first auth) then checks for a `vehicles` row.
 *
 * Centralized here so the same check runs from every route without each
 * one reaching into Kysely directly.
 */
export async function hasVehicleForClerkUser(
  clerkUserId: string,
): Promise<boolean> {
  const { id: userId } = await getOrLinkUserByClerkId(db, clerkUserId, () =>
    resolveClerkPrimaryEmail(clerkUserId),
  );
  return hasVehicle(db, userId);
}
