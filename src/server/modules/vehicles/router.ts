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
import { selectFleetVehicleForOnboarding } from '#/server/modules/vehicles/selectFleetVehicleForOnboarding';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  completeOnboardingFromTeslaInputSchema,
  upsertOverridesInputSchema,
  type VehicleEnergyProfile,
} from '#/shared/vehicles/contracts';

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

  completeOnboardingFromTesla: protectedProcedure
    .input(completeOnboardingFromTeslaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const vehicles = await loadTeslaFleetVehiclesProtected(ctx);

      if (vehicles.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'No Tesla vehicle found on your account. Add a vehicle in the Tesla app, then try again.',
        });
      }

      const target = selectFleetVehicleForOnboarding(
        vehicles,
        input.teslaVehicleId,
      );
      if (!target) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'That vehicle was not found on your Tesla account. Refresh the list and pick a vehicle from your account.',
        });
      }

      const inputRow = completeOnboardingInputFromFleetSummary(target);
      if (!inputRow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Could not resolve your Tesla model and year from its VIN. Contact support if this persists.',
        });
      }

      const vehicle = await completeOnboarding(ctx.db, ctx.userId, inputRow);
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
