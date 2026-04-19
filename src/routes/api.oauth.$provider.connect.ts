import { createFileRoute } from '@tanstack/react-router';
import { handleOAuthConnect } from '#/server/oauth/handlers';

// Import registers every OAuth integration's provider at module load.
import '#/server/integrations/tesla';

export const Route = createFileRoute('/api/oauth/$provider/connect')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleOAuthConnect(params.provider, request),
    },
  },
});
