import { TRPCError } from '@trpc/server';
import { resolveEnergyProfile } from '#/server/capabilities/vehicles/domain/resolveEnergyProfile';
import {
  completeOnboarding,
  deleteVehicle,
  getVehicle,
  upsertOverrides,
} from '#/server/capabilities/vehicles/store';
import { completeOnboardingInputFromFleetSummary } from '#/server/integrations/tesla/onboardingIdentity';
import { loadTeslaFleetVehiclesProtected } from '#/server/modules/tesla/loadFleetTrpc';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  upsertOverridesInputSchema,
  type VehicleEnergyProfile,
} from '#/shared/vehicles/contracts';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';

/**
 * The **Vehicle** persistence surface. Read returns the resolved
 * **Energy Profile** alongside the raw row so callers can both render
 * Driver-editable preferences (the row) and feed the agent (the profile).
 */
export const vehicleRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const vehicle = await getVehicle(ctx.db, ctx.userId);
    const profile: VehicleEnergyProfile | null = vehicle
      ? resolveEnergyProfile(vehicle)
      : null;
    return { vehicle, profile };
  }),

  completeOnboardingFromTesla: protectedProcedure.mutation(async ({ ctx }) => {
    const vehicles = await loadTeslaFleetVehiclesProtected(ctx);

    const row = await getVehicle(ctx.db, ctx.userId);
    const target =
      pickTeslaVehicleForIdentity(vehicles, row) ?? vehicles[0] ?? null;
    if (!target) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'No Tesla vehicle found on your account. Add a vehicle in the Tesla app, then try again.',
      });
    }

    const input = completeOnboardingInputFromFleetSummary(target);
    if (!input) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Could not resolve your Tesla model and year from its VIN. Contact support if this persists.',
      });
    }

    const vehicle = await completeOnboarding(ctx.db, ctx.userId, input);
    return {
      vehicle,
      profile: resolveEnergyProfile(vehicle),
    };
  }),

  upsertOverrides: protectedProcedure
    .input(upsertOverridesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const vehicle = await upsertOverrides(ctx.db, ctx.userId, input);
      return {
        vehicle,
        profile: vehicle ? resolveEnergyProfile(vehicle) : null,
      };
    }),

  resetForReonboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteVehicle(ctx.db, ctx.userId);
    return { ok: true };
  }),
});
