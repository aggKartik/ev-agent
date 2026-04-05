import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }).optional())
    .query(({ input }) => {
      return `Hello ${input?.name ?? 'World'}!`;
    }),

  create: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(({ input }) => {
      return { id: '1', text: input.text, createdAt: new Date() };
    }),
});
