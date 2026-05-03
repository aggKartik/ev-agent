import { z } from 'zod';

/** Lat/lng pair shared by plan contracts and server EV routing. */
export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof coordinateSchema>;
