import { createAPIFileRoute } from '@tanstack/react-start/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '#/server/context';
import { appRouter } from '#/server/routers';

export const APIRoute = createAPIFileRoute('/api/trpc/$trpc')({
  GET: async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext,
    });
  },
  POST: async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext,
    });
  },
});
