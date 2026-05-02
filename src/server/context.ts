import { auth } from '@clerk/tanstack-react-start/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from './db';
import { getOrLinkUserByClerkId, resolveClerkPrimaryEmail } from './users';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const { userId: clerkUserId, isAuthenticated } = await auth();

  let userIdPromise: Promise<number | null> | null = null;
  const getUserId = async () => {
    if (!isAuthenticated || !clerkUserId) return null;

    userIdPromise ??= getOrLinkUserByClerkId(db, clerkUserId, () =>
      resolveClerkPrimaryEmail(clerkUserId),
    ).then((user) => user.id);

    return userIdPromise;
  };

  return {
    headers: opts.req.headers,
    db,
    clerkUserId: isAuthenticated ? clerkUserId : null,
    userId: null as number | null,
    getUserId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
