import { Box, Grid } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { Text } from '#/components/ui/Text';
import TripCard from '#/features/dashboard/components/TripCard';
import type { DashboardRecentTrip } from '#/features/dashboard/types/contracts';
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
          Recent · {trips.length.toString().padStart(2, '0')}
        </Box>
        <Text as="h2" id="recent-trips" className={slots.sectionTitle}>
          Trips you&apos;ve taken
        </Text>
        <Text className={slots.sectionSub}>
          Plans you run will land here once trip persistence ships.
        </Text>
      </Box>

      {trips.length === 0 ? (
        <Box
          padding="6"
          borderWidth="1px"
          borderColor="alpha.cream-12"
          borderRadius="lg"
          background="alpha.cream-04"
        >
          <Text textStyle="caption" color="cream.600" marginBottom="3">
            No trips yet — plan your first one.
          </Text>
          <Button variant="primary" size="sm" onClick={onPlan}>
            Plan a trip
          </Button>
        </Box>
      ) : (
        <Grid
          gridTemplateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
          gap="5"
        >
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPlan={onPlan} />
          ))}
        </Grid>
      )}
    </Box>
  );
}
