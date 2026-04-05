import { router } from '../trpc';
import { exampleRouter } from './example';

export const appRouter = router({
  example: exampleRouter,
  // Add more feature routers here
});

export type AppRouter = typeof appRouter;
