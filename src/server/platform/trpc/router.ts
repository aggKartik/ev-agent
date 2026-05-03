import { registerAllProviders } from '#/server/integrations';
import { oauthRouter } from '#/server/modules/oauth/router';
import { planRouter } from '#/server/modules/plan/router';
import { teslaRouter } from '#/server/modules/tesla/router';
import { userRouter } from '#/server/modules/users/router';
import { vehicleRouter } from '#/server/modules/vehicles/router';
import { router } from './procedures';

// Explicit registration of every OAuth provider integration. Runs once at
// module load so the registry is populated before any tRPC request arrives.
registerAllProviders();

export const appRouter = router({
  oauth: oauthRouter,
  plan: planRouter,
  tesla: teslaRouter,
  user: userRouter,
  vehicle: vehicleRouter,
  // Add more feature routers here
});

export type AppRouter = typeof appRouter;
