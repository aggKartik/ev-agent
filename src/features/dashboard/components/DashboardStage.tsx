import { Box, Grid, Stack } from 'styled-system/jsx';
import AgentFeed from '#/features/dashboard/components/AgentFeed';
import CarStatusPanel from '#/features/dashboard/components/CarStatusPanel';
import Hero from '#/features/dashboard/components/Hero';
import QuickDestinations from '#/features/dashboard/components/QuickDestinations';
import RecentTrips from '#/features/dashboard/components/RecentTrips';
import UtilityTiles from '#/features/dashboard/components/UtilityTiles';
import type { DashboardSummary } from '#/features/dashboard/types/contracts';
import { dashboard } from '#/styled-system/recipes/dashboard';

type DashboardStageProps = {
  summary: DashboardSummary;
  isRefreshing: boolean;
  onPlan: () => void;
  onConnectTesla: () => void;
  onRefresh: () => void;
  onRerunSetup: () => void;
};

const NAV_ITEMS = ['Home', 'Trips', 'Charge', 'Saved'] as const;

export default function DashboardStage({
  summary,
  isRefreshing,
  onPlan,
  onConnectTesla,
  onRefresh,
  onRerunSetup,
}: DashboardStageProps) {
  const slots = dashboard();
  const driverFirstName =
    summary.profile.driverLabel.trim().split(/\s+/)[0] || 'Driver';

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
            onRerunSetup={onRerunSetup}
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
