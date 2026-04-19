import { createFileRoute } from '@tanstack/react-router';
import { handleOAuthCallback } from '#/server/oauth/handlers';

// Import registers every OAuth integration's provider at module load.
import '#/server/integrations/tesla';

export const Route = createFileRoute('/api/oauth/$provider/callback')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleOAuthCallback(params.provider, request),
    },
  },
});
