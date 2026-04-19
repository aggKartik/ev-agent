import { createAPIFileRoute } from '@tanstack/react-start/api';
import { handleOAuthCallback } from '#/server/oauth/handlers';

// Import registers every OAuth integration's provider at module load.
import '#/server/integrations/tesla';

export const APIRoute = createAPIFileRoute('/-api/oauth/$provider/callback')({
  GET: async ({ request, params }) =>
    handleOAuthCallback(params.provider, request),
});
