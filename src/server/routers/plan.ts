import {
  addressSuggestSchema,
  planRequestSchema,
} from '#/features/plan/contracts';
import {
  createMockPlanResult,
  getPlanCatalog,
  suggestPlanAddresses,
} from '#/features/plan/helpers';
import { publicProcedure, router } from '../trpc';

export const planRouter = router({
  catalog: publicProcedure.query(() => getPlanCatalog()),

  suggestAddresses: publicProcedure
    .input(addressSuggestSchema)
    .query(({ input }) => suggestPlanAddresses(input.query)),

  create: publicProcedure.input(planRequestSchema).mutation(({ input }) => {
    return createMockPlanResult(input);
  }),
});
