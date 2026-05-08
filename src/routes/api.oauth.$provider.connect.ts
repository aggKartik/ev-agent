import { createFileRoute } from '@tanstack/react-router';
import { handleOAuthConnect } from '#/server/oauth/handlers';

export const Route = createFileRoute('/api/oauth/$provider/connect')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleOAuthConnect(params.provider, request),
    },
  },
});
