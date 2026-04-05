import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    // Add context properties here (user, session, etc.)
    headers: opts.req.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
