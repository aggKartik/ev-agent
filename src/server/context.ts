import { auth } from '@clerk/tanstack-react-start/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from './db';
import { getOrLinkUserByClerkId, resolveClerkPrimaryEmail } from './users';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const { userId: clerkUserId, isAuthenticated } = await auth();

  let userId: number | null = null;
  if (isAuthenticated && clerkUserId) {
    const user = await getOrLinkUserByClerkId(db, clerkUserId, () =>
      resolveClerkPrimaryEmail(clerkUserId),
    );
    userId = user.id;
  }

  return {
    headers: opts.req.headers,
    db,
    clerkUserId: isAuthenticated ? clerkUserId : null,
    userId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
