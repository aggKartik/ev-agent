import { Box } from 'styled-system/jsx';
import type { DashboardActivityEvent } from '#/features/dashboard/contracts';
import { toneStyle } from '#/features/dashboard/tone';
import { cx } from '#/styled-system/css';
import { chip } from '#/styled-system/recipes/chip';
import { dashboard } from '#/styled-system/recipes/dashboard';
import { panel } from '#/styled-system/recipes/panel';

type AgentFeedProps = {
  events: DashboardActivityEvent[];
};

export default function AgentFeed({ events }: AgentFeedProps) {
  const slots = dashboard();

  return (
    <Box as="section" gridArea="feed" aria-labelledby="agent-feed">
      <Box className={cx(panel({ variant: 'glass' }), slots.feed)}>
        <Box className={slots.feedHead}>
          <Box as="span" id="agent-feed" className={slots.kicker}>
            Agent feed · live
          </Box>
          <Box as="span" className={chip({ tone: 'live' })}>
            Watching
          </Box>
        </Box>
        <Box as="ul" className={slots.feedList}>
          {events.map((event) => (
            <Box
              as="li"
              key={event.id}
              className={slots.feedRow}
              style={toneStyle(event.tone)}
            >
              <Box as="span" className={slots.feedTime}>
                {event.time}
              </Box>
              <Box as="span" className={slots.feedBullet} aria-hidden="true">
                ▸
              </Box>
              <Box as="span" className={slots.feedMessage}>
                {event.message}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
