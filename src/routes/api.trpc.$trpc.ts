import { createFileRoute } from '@tanstack/react-router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '#/server/platform/context';
import { appRouter } from '#/server/platform/trpc/router';

export const Route = createFileRoute('/api/trpc/$trpc')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        fetchRequestHandler({
          endpoint: '/api/trpc',
          req: request,
          router: appRouter,
          createContext,
        }),
      POST: async ({ request }) =>
        fetchRequestHandler({
          endpoint: '/api/trpc',
          req: request,
          router: appRouter,
          createContext,
        }),
    },
  },
});
