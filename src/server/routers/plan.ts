import { tracked } from '@trpc/server';
import {
  addressSuggestSchema,
  type PlanStreamEvent,
  planRequestSchema,
} from '#/features/plan/contracts';
import { getPlanCatalog, suggestPlanAddresses } from '#/features/plan/helpers';
import { createEventQueue } from '#/server/ai/eventQueue';
import { runPlanAgent } from '#/server/ai/planAgent';
import { publicProcedure, router } from '../trpc';

export const planRouter = router({
  catalog: publicProcedure.query(() => getPlanCatalog()),

  suggestAddresses: publicProcedure
    .input(addressSuggestSchema)
    .query(({ input }) => suggestPlanAddresses(input.query)),

  stream: publicProcedure
    .input(planRequestSchema)
    .subscription(async function* ({ input, signal }) {
      const queue = createEventQueue<PlanStreamEvent>();
      const agentDone = runPlanAgent(input, queue.push, { signal })
        .then(() => queue.close())
        .catch((err: unknown) => {
          queue.close(err instanceof Error ? err : new Error(String(err)));
        });

      let id = 0;
      try {
        for await (const event of queue.iterate({ signal })) {
          id += 1;
          yield tracked(String(id), event);
        }
      } finally {
        queue.close();
        await agentDone.catch(() => undefined);
      }
    }),
});
