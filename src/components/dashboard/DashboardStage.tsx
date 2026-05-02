import { Box, Grid, Stack } from 'styled-system/jsx';
import AgentFeed from '#/components/dashboard/AgentFeed';
import CarStatusPanel from '#/components/dashboard/CarStatusPanel';
import Hero from '#/components/dashboard/Hero';
import QuickDestinations from '#/components/dashboard/QuickDestinations';
import RecentTrips from '#/components/dashboard/RecentTrips';
import UtilityTiles from '#/components/dashboard/UtilityTiles';
import type { DashboardSummary } from '#/features/dashboard/contracts';
import { dashboard } from '../../../styled-system/recipes/dashboard';

type DashboardStageProps = {
  summary: DashboardSummary;
  isRefreshing: boolean;
  onPlan: () => void;
  onConnectTesla: () => void;
  onRefresh: () => void;
};

const NAV_ITEMS = ['Home', 'Trips', 'Charge', 'Saved'] as const;

export default function DashboardStage({
  summary,
  isRefreshing,
  onPlan,
  onConnectTesla,
  onRefresh,
}: DashboardStageProps) {
  const slots = dashboard();
  const driverFirstName =
    summary.profile.driverLabel.split(/\s+/)[0] ?? 'Driver';

  return (
    <>
      <nav className={slots.nav} aria-label="Dashboard sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className={slots.navButton}
            onClick={item === 'Home' ? undefined : onPlan}
            aria-current={item === 'Home' ? 'page' : undefined}
          >
            {item}
          </button>
        ))}
      </nav>

      <Grid className={slots.grid}>
        <Stack
          gridArea="hero"
          display="flex"
          flexDirection="column"
          gap={{ base: '5', md: '7' }}
        >
          <Hero
            driverFirstName={driverFirstName}
            generatedAt={summary.generatedAt}
            onPlan={onPlan}
          />
          <QuickDestinations summary={summary} onPlan={onPlan} />
        </Stack>

        <Box gridArea="car">
          <CarStatusPanel
            tesla={summary.tesla}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onConnect={onConnectTesla}
          />
        </Box>

        <RecentTrips trips={summary.recentTrips} onPlan={onPlan} />
        <AgentFeed events={summary.activityFeed} />
        <UtilityTiles
          tiles={summary.utilities}
          onPlan={onPlan}
          onConnectTesla={onConnectTesla}
        />
      </Grid>
    </>
  );
}
