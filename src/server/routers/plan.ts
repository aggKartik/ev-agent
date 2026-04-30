import {
  addressSuggestSchema,
  planRequestSchema,
} from '#/features/plan/contracts';
import {
  createMockPlanResult,
  getPlanCatalog,
  suggestPlanAddresses,
} from '#/features/plan/helpers';
import { protectedProcedure, router } from '../trpc';

export const planRouter = router({
  catalog: protectedProcedure.query(() => getPlanCatalog()),

  suggestAddresses: protectedProcedure
    .input(addressSuggestSchema)
    .query(({ input }) => suggestPlanAddresses(input.query)),

  create: protectedProcedure.input(planRequestSchema).mutation(({ input }) => {
    return createMockPlanResult(input);
  }),
});
