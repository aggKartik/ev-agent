import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  getTeslaCurrentLocation,
  getTeslaVehiclePrefill,
  listTeslaVehicles,
  refreshTeslaVehicles,
} from './fleetProcedures';
import { getSendItineraryCapability } from './sendItinerary/capability';
import { sendItineraryInputSchema } from './sendItinerary/contracts';
import { sendItineraryToTesla } from './sendItinerary/service';

export const teslaRouter = router({
  vehicles: protectedProcedure.query(({ ctx }) => listTeslaVehicles(ctx)),

  refresh: protectedProcedure.mutation(({ ctx }) => refreshTeslaVehicles(ctx)),

  currentLocation: protectedProcedure.query(({ ctx }) =>
    getTeslaCurrentLocation(ctx),
  ),

  vehiclePrefill: protectedProcedure.query(({ ctx }) =>
    getTeslaVehiclePrefill(ctx),
  ),

  sendItineraryCapability: protectedProcedure.query(() =>
    getSendItineraryCapability(),
  ),

  sendItinerary: protectedProcedure
    .input(sendItineraryInputSchema)
    .mutation(({ ctx, input }) => sendItineraryToTesla(ctx, input)),
});
