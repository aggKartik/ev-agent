// Side-effect imports: each integration registers its OAuthProvider in the
// global registry when first loaded. Importing them here means the registry
// is populated before any tRPC request arrives.
import '#/server/integrations/tesla';

import { oauthRouter } from '#/server/modules/oauth/router';
import { planRouter } from '#/server/modules/plan/router';
import { teslaRouter } from '#/server/modules/tesla/router';
import { userRouter } from '#/server/modules/users/router';
import { router } from './procedures';

export const appRouter = router({
  oauth: oauthRouter,
  plan: planRouter,
  tesla: teslaRouter,
  user: userRouter,
  // Add more feature routers here
});

export type AppRouter = typeof appRouter;
