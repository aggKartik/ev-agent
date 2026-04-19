import { createAPIFileRoute } from '@tanstack/react-start/api';
import { handleOAuthConnect } from '#/server/oauth/handlers';

// Import registers every OAuth integration's provider at module load.
import '#/server/integrations/tesla';

export const APIRoute = createAPIFileRoute('/-api/oauth/$provider/connect')({
  GET: async ({ request, params }) =>
    handleOAuthConnect(params.provider, request),
});
