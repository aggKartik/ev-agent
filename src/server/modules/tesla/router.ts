import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  getTeslaCurrentLocation,
  getTeslaVehiclePrefill,
  listTeslaVehicles,
  refreshTeslaVehicles,
} from './fleetProcedures';
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

  sendItinerary: protectedProcedure
    .input(sendItineraryInputSchema)
    .mutation(({ ctx, input }) => sendItineraryToTesla(ctx, input)),
});
