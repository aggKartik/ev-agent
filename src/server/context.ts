import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from './db';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    // Add context properties here (user, session, etc.)
    headers: opts.req.headers,
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
