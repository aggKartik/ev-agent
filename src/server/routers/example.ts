import { sql } from 'kysely';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const exampleRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    const result = await sql<{ now: Date }>`select now() as now`.execute(
      ctx.db,
    );
    const now = result.rows[0]?.now ?? new Date();

    return {
      ok: true,
      at: now,
    };
  }),

  hello: publicProcedure
    .input(z.object({ name: z.string() }).optional())
    .query(({ input }) => {
      return `Hello ${input?.name ?? 'World'}!`;
    }),

  create: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(({ input }) => {
      return {
        id: '1',
        text: input.text,
        createdAt: new Date(),
      };
    }),
});
