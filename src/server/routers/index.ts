// Side-effect imports: each integration registers its OAuthProvider in the
// global registry when first loaded. Importing them here means the registry
// is populated before any tRPC request arrives.
import '#/server/integrations/tesla';

import { router } from '../trpc';
import { exampleRouter } from './example';
import { oauthRouter } from './oauth';
import { teslaRouter } from './tesla';

export const appRouter = router({
  example: exampleRouter,
  oauth: oauthRouter,
  tesla: teslaRouter,
  // Add more feature routers here
});

export type AppRouter = typeof appRouter;
