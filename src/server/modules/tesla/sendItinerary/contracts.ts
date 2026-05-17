import { z } from 'zod';
import type { TESLA_NAVIGATION_WAYPOINTS_COMMAND } from '#/server/integrations/tesla/commands/navigation';
import { planResultSchema } from '#/shared/plan/contracts';

export const sendItineraryInputSchema = z.object({
  result: planResultSchema,
  vehicleId: z.string().min(1).optional(),
});

export type SendItineraryInput = z.infer<typeof sendItineraryInputSchema>;

export type SendItineraryResult = {
  sent: true;
  vehicleDisplayName: string | null;
  vinSuffix: string;
  stopCount: number;
  command: typeof TESLA_NAVIGATION_WAYPOINTS_COMMAND;
};
