import { createFileRoute } from '@tanstack/react-router';
import { handleOAuthCallback } from '#/server/oauth/handlers';

export const Route = createFileRoute('/api/oauth/$provider/callback')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleOAuthCallback(params.provider, request),
    },
  },
});
