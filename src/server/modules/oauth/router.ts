import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { listProviders, tryGetProviderBySlug } from '#/server/oauth/registry';
import { deleteLinkedAccount, getLinkedStatus } from '#/server/oauth/store';
import {
  protectedProcedure,
  publicProcedure,
  router,
} from '#/server/platform/trpc/procedures';

/**
 * Generic cross-provider OAuth lifecycle procedures. Provider-specific data
 * (e.g. Tesla vehicles) lives in its own router.
 */

const providerInput = z.object({ provider: z.string().min(1) });

function requireProvider(slug: string) {
  const provider = tryGetProviderBySlug(slug);
  if (!provider) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Unknown OAuth provider "${slug}".`,
    });
  }
  return provider;
}

export const oauthRouter = router({
  list: publicProcedure.query(() =>
    listProviders().map((p) => ({
      slug: p.slug,
      label: p.label,
      description: p.description,
    })),
  ),

  status: protectedProcedure
    .input(providerInput)
    .query(async ({ ctx, input }) => {
      requireProvider(input.provider);
      return getLinkedStatus(ctx.db, input.provider, ctx.userId);
    }),

  disconnect: protectedProcedure
    .input(providerInput)
    .mutation(async ({ ctx, input }) => {
      requireProvider(input.provider);
      await deleteLinkedAccount(ctx.db, input.provider, ctx.userId);
      return { ok: true };
    }),
});
