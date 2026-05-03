import { Box, Grid } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import TripCard from '#/features/dashboard/components/TripCard';
import type { DashboardRecentTrip } from '#/features/dashboard/contracts';
import { dashboard } from '#/styled-system/recipes/dashboard';

type RecentTripsProps = {
  trips: DashboardRecentTrip[];
  onPlan: () => void;
};

export default function RecentTrips({ trips, onPlan }: RecentTripsProps) {
  const slots = dashboard();

  return (
    <Box as="section" gridArea="trips" aria-labelledby="recent-trips">
      <Box className={slots.sectionHead}>
        <Box as="span" className={slots.kicker}>
          Recent · {trips.length.toString().padStart(2, '0')} / 26
        </Box>
        <Text as="h2" id="recent-trips" className={slots.sectionTitle}>
          Trips you&apos;ve taken
        </Text>
        <Text className={slots.sectionSub}>
          Recall, remix, or share. Persistence hooks are ready for the next DB
          write path.
        </Text>
      </Box>

      <Grid
        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
        gap="5"
      >
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPlan={onPlan} />
        ))}
      </Grid>
    </Box>
  );
}
