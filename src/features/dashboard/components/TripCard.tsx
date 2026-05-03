import { Box } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import TripMiniMap from '#/features/dashboard/components/TripMiniMap';
import type { DashboardRecentTrip } from '#/features/dashboard/types/contracts';
import { toneStyle } from '#/features/dashboard/utils/tone';
import { chip } from '#/styled-system/recipes/chip';
import { dashboard } from '#/styled-system/recipes/dashboard';

type TripCardProps = {
  trip: DashboardRecentTrip;
  onPlan: () => void;
};

export default function TripCard({ trip, onPlan }: TripCardProps) {
  const slots = dashboard();

  return (
    <button
      type="button"
      className={slots.tripCard}
      style={toneStyle(trip.tone)}
      onClick={onPlan}
    >
      <Box className={slots.tripMap}>
        <TripMiniMap trip={trip} />
      </Box>
      <Box className={slots.tripBody}>
        <Box className={slots.tripWhen}>{trip.when}</Box>
        <Text as="h3" className={slots.tripTitle}>
          {trip.title}
        </Text>
        <Box className={slots.tripMeta}>
          <span>{trip.from}</span>
          <span>→</span>
          <span>{trip.to}</span>
        </Box>
        <Box className={slots.tripMeta}>
          <span>
            <b>{trip.miles}</b> mi
          </span>
          <span>·</span>
          <span>
            <b>{trip.duration}</b>
          </span>
          <span>·</span>
          <span>
            <b>{trip.stops}</b> stops
          </span>
        </Box>
        <Box display="flex" flexWrap="wrap" gap="1.5" mt="1">
          {trip.activities.map((activity) => (
            <Box
              as="span"
              key={activity}
              className={chip({ size: 'micro', tone: 'neutral' })}
            >
              {activity}
            </Box>
          ))}
        </Box>
      </Box>
    </button>
  );
}
