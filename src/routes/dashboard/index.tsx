import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import { Text } from '#/components/Text';
import type {
  DashboardActivityEvent,
  DashboardRecentTrip,
  DashboardSummary,
  DashboardTeslaSummary,
  DashboardUtilityTile,
} from '#/features/dashboard/contracts';
import { DASHBOARD_PROMPT_SUGGESTIONS } from '#/features/dashboard/data';
import { getDashboardFallbackSummary } from '#/features/dashboard/helpers';
import { trpc } from '#/lib/trpc';
import { css, cx } from '../../../styled-system/css';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRoute,
});

const toneColor = {
  peach: '#ff9566',
  lime: '#d6ff3d',
  magenta: '#e94a8c',
  violet: '#7b4bd1',
  muted: 'rgba(245, 234, 208, 0.38)',
} as const;

const BATTERY_SEGMENTS = Array.from(
  { length: 10 },
  (_, index) => `segment-${index}`,
);

const stageClass = css({
  maxWidth: '92rem',
  alignItems: 'stretch',
  gap: { base: '6', lg: '8' },
  px: { base: '0', md: '2' },
});

const navClass = css({
  display: { base: 'none', lg: 'flex' },
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7',
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: '0.22em',
  color: 'cream.600',
  textTransform: 'uppercase',
});

const navButtonClass = css({
  color: 'inherit',
  background: 'transparent',
  borderWidth: '0',
  cursor: 'pointer',
  py: '1.5',
  transition: 'color 160ms ease, text-shadow 160ms ease',
  _hover: {
    color: 'peach.300',
    textShadow: '0 0 16px rgba(255, 149, 102, 0.35)',
  },
});

const dashboardGridClass = css({
  width: 'full',
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    lg: 'minmax(0, 1fr) minmax(320px, 380px)',
  },
  gridTemplateAreas: {
    base: '"hero" "car" "trips" "feed" "utils"',
    lg: '"hero car" "trips trips" "feed utils"',
  },
  gap: { base: '5', md: '7', lg: '8' },
});

const heroClass = css({
  gridArea: 'hero',
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '5', md: '7' },
});

const panelClass = css({
  borderWidth: '1px',
  borderColor: 'alpha.cream-12',
  borderRadius: '2xl',
  background: 'rgba(15, 10, 36, 0.62)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 30px 80px -40px rgba(0, 0, 0, 0.65)',
});

const tagClass = css({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2.5',
  px: '3',
  py: '1.5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream-10',
  background: 'rgba(15, 10, 36, 0.5)',
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: '0.22em',
  color: 'cream.600',
  textTransform: 'uppercase',
});

const pulseClass = css({
  width: '8px',
  height: '8px',
  borderRadius: 'full',
  background: 'peach.400',
  boxShadow: '0 0 0 0 rgba(255, 149, 102, 0.55)',
  animation: 'pulse 1.6s ease-out infinite',
});

const titleClass = css({
  margin: 0,
  fontFamily: 'display',
  fontSize: { base: '48px', md: '72px', xl: '88px' },
  lineHeight: '0.95',
  letterSpacing: '-0.04em',
  fontWeight: 'semibold',
  color: 'cream.200',
});

const titleAccentClass = css({
  fontFamily: 'serif',
  fontStyle: 'italic',
  fontWeight: 'normal',
  background: 'linear-gradient(135deg, #ff9566, #e94a8c)',
  backgroundClip: 'text',
  color: 'transparent',
});

const titleNameClass = css({
  display: 'inline-block',
  mt: '3',
  px: '3.5',
  py: '1.5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'rgba(255, 149, 102, 0.32)',
  background: 'rgba(255, 149, 102, 0.1)',
  fontFamily: 'mono',
  fontSize: '0.42em',
  letterSpacing: '0.18em',
  color: 'peach.300',
  verticalAlign: 'middle',
});

const promptClass = css({
  position: 'relative',
  p: { base: '5', md: '6' },
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  _focusWithin: {
    borderColor: 'rgba(255, 149, 102, 0.42)',
    boxShadow:
      '0 0 0 1px rgba(255, 149, 102, 0.18), 0 30px 80px -30px rgba(255, 149, 102, 0.2)',
  },
});

const promptPrefixClass = css({
  display: 'block',
  mb: '2',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.24em',
  color: 'peach.300',
  textTransform: 'uppercase',
});

const promptInputClass = css({
  width: 'full',
  minHeight: '78px',
  resize: 'vertical',
  borderWidth: '0',
  outline: '0',
  background: 'transparent',
  color: 'cream.200',
  fontFamily: 'sans',
  fontSize: { base: '18px', md: '22px' },
  fontWeight: 'medium',
  lineHeight: '1.4',
  caretColor: 'peach.300',
  _placeholder: {
    color: 'cream.600',
  },
});

const promptActionsClass = css({
  mt: '5',
  pt: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'dashed',
  borderTopColor: 'alpha.cream-10',
  display: 'flex',
  flexDirection: { base: 'column', md: 'row' },
  alignItems: { base: 'stretch', md: 'center' },
  justifyContent: 'space-between',
  gap: '3',
});

const promptToolsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const toolChipClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  px: '3',
  py: '1.5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream-12',
  color: 'cream.600',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
});

const quickClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '2.5',
});

const quickLabelClass = css({
  mr: '1',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.22em',
  color: 'cream.600',
  textTransform: 'uppercase',
});

const quickChipClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '3.5',
  py: '2',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream-12',
  background: 'rgba(15, 10, 36, 0.5)',
  color: 'cream.200',
  cursor: 'pointer',
  transition:
    'transform 160ms ease, border-color 160ms ease, background 160ms ease',
  _hover: {
    transform: 'translateY(-1px)',
    borderColor: 'rgba(255, 149, 102, 0.48)',
    background: 'rgba(255, 149, 102, 0.08)',
  },
});

const dotClass = css({
  width: '8px',
  height: '8px',
  borderRadius: 'full',
  background: 'var(--tone)',
  boxShadow: '0 0 10px var(--tone)',
  flexShrink: 0,
});

const quickTextClass = css({
  fontSize: '13px',
  fontWeight: 'semibold',
});

const quickSubClass = css({
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'cream.600',
});

const carAreaClass = css({
  gridArea: 'car',
});

const carPanelClass = css({
  position: 'relative',
  overflow: 'hidden',
  p: '6',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  background:
    'linear-gradient(160deg, rgba(255, 149, 102, 0.08), transparent 52%), rgba(15, 10, 36, 0.66)',
  _after: {
    content: '""',
    position: 'absolute',
    top: '-60px',
    right: '-70px',
    width: '260px',
    height: '260px',
    borderRadius: 'full',
    background:
      'radial-gradient(circle, rgba(255, 149, 102, 0.18), transparent 70%)',
    pointerEvents: 'none',
  },
});

const sectionKickerClass = css({
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.24em',
  color: 'peach.300',
  textTransform: 'uppercase',
});

const carHeadClass = css({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const statusPillClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.14em',
  color: 'lime.300',
  textTransform: 'uppercase',
});

const carNameClass = css({
  position: 'relative',
  zIndex: 1,
  fontFamily: 'display',
  fontSize: '24px',
  fontWeight: 'semibold',
  color: 'cream.200',
  letterSpacing: '-0.02em',
  textTransform: 'uppercase',
});

const carDetailClass = css({
  position: 'relative',
  zIndex: 1,
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.14em',
  color: 'cream.600',
  textTransform: 'uppercase',
});

const batteryRowClass = css({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '3.5',
});

const batteryFrameClass = css({
  position: 'relative',
  flex: 1,
  height: '18px',
  borderRadius: 'md',
  borderWidth: '1px',
  borderColor: 'alpha.cream-20',
  overflow: 'hidden',
  background: 'rgba(0, 0, 0, 0.35)',
});

const batteryFillClass = css({
  position: 'absolute',
  inset: 0,
  width: 'var(--battery)',
  background: 'linear-gradient(90deg, #ff9566, #d6ff3d)',
  boxShadow: '0 0 16px rgba(214, 255, 61, 0.25) inset',
});

const batterySegmentsClass = css({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(10, 1fr)',
  '& span': {
    borderRightWidth: '1px',
    borderRightColor: 'rgba(15, 10, 36, 0.45)',
  },
  '& span:last-child': {
    borderRightWidth: '0',
  },
});

const batteryPctClass = css({
  fontFamily: 'display',
  fontSize: '32px',
  fontWeight: 'bold',
  lineHeight: 1,
  color: 'cream.200',
  '& small': {
    ml: '1',
    fontSize: '14px',
    color: 'cream.600',
  },
});

const carStatsClass = css({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1px',
  overflow: 'hidden',
  borderRadius: 'lg',
  background: 'alpha.cream-10',
});

const carStatClass = css({
  background: 'rgba(15, 10, 36, 0.72)',
  p: '3',
});

const carStatValueClass = css({
  fontFamily: 'display',
  fontSize: '22px',
  fontWeight: 'semibold',
  lineHeight: 1,
  color: 'cream.200',
  '& small': {
    ml: '1',
    fontSize: '11px',
    color: 'cream.600',
    fontWeight: 'normal',
  },
});

const carStatLabelClass = css({
  mt: '1',
  fontFamily: 'mono',
  fontSize: '9px',
  letterSpacing: '0.18em',
  color: 'cream.600',
});

const disabledActionRowClass = css({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2',
});

const disabledActionClass = css({
  py: '2.5',
  px: '3',
  borderRadius: 'lg',
  borderWidth: '1px',
  borderColor: 'alpha.cream-16',
  background: 'alpha.cream-06',
  color: 'cream.600',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  cursor: 'not-allowed',
});

const carSvgWrapClass = css({
  position: 'relative',
  zIndex: 1,
  mt: '1',
  pt: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'dashed',
  borderTopColor: 'alpha.cream-10',
});

const sectionHeadClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  mb: '5',
});

const sectionTitleClass = css({
  margin: 0,
  fontFamily: 'display',
  fontSize: { base: '28px', md: '38px' },
  fontWeight: 'semibold',
  letterSpacing: '-0.03em',
  color: 'cream.200',
});

const sectionSubClass = css({
  fontFamily: 'serif',
  fontStyle: 'italic',
  fontSize: '16px',
  color: 'cream.600',
});

const tripsAreaClass = css({
  gridArea: 'trips',
});

const tripsGridClass = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
  gap: '5',
});

const tripCardClass = css({
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  borderWidth: '1px',
  borderColor: 'alpha.cream-10',
  borderRadius: 'xl',
  background: 'rgba(15, 10, 36, 0.58)',
  backdropFilter: 'blur(12px)',
  color: 'cream.200',
  textAlign: 'left',
  cursor: 'pointer',
  transition:
    'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
  _hover: {
    transform: 'translateY(-3px)',
    borderColor: 'var(--tone)',
    boxShadow: '0 0 0 1px var(--tone), 0 30px 60px -30px rgba(0, 0, 0, 0.7)',
  },
});

const tripMapClass = css({
  height: '120px',
  borderBottomWidth: '1px',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'alpha.cream-10',
  background:
    'radial-gradient(circle at 50% 30%, rgba(255, 149, 102, 0.08), transparent 70%), rgba(15, 10, 36, 0.5)',
});

const tripBodyClass = css({
  p: '4.5',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

const tripWhenClass = css({
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: 'var(--tone)',
  textTransform: 'uppercase',
});

const tripTitleClass = css({
  margin: 0,
  fontFamily: 'display',
  fontSize: '18px',
  fontWeight: 'semibold',
  lineHeight: 1.2,
  color: 'cream.200',
});

const tripMetaClass = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1.5',
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: '0.06em',
  color: 'cream.600',
  '& b': {
    color: 'cream.200',
  },
});

const activityChipClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: '2.5',
  py: '1',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream-10',
  background: 'alpha.cream-06',
  fontFamily: 'mono',
  fontSize: '9px',
  letterSpacing: '0.16em',
  color: 'cream.600',
  textTransform: 'uppercase',
});

const feedAreaClass = css({
  gridArea: 'feed',
});

const feedClass = css({
  p: '5',
  height: 'full',
});

const feedHeadClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  pb: '3',
  mb: '2',
  borderBottomWidth: '1px',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'alpha.cream-10',
});

const feedListClass = css({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
});

const feedRowClass = css({
  display: 'grid',
  gridTemplateColumns: '56px 14px 1fr',
  gap: '2.5',
  py: '2',
  alignItems: 'baseline',
  borderBottomWidth: '1px',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'alpha.cream-06',
  fontFamily: 'mono',
  fontSize: '12px',
  lineHeight: 1.5,
  _last: {
    borderBottomWidth: '0',
  },
});

const feedTimeClass = css({
  color: 'cream.600',
  fontSize: '10px',
  letterSpacing: '0.12em',
});

const feedBulletClass = css({
  color: 'var(--tone)',
});

const feedMessageClass = css({
  color: 'cream.200',
});

const utilsAreaClass = css({
  gridArea: 'utils',
  display: 'grid',
  gridTemplateColumns: { base: '1fr', sm: '1fr 1fr' },
  gap: '3',
  alignContent: 'start',
});

const utilTileClass = css({
  position: 'relative',
  minHeight: '116px',
  display: 'grid',
  gap: '1.5',
  p: '4.5',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderColor: 'alpha.cream-10',
  background: 'rgba(15, 10, 36, 0.58)',
  color: 'cream.200',
  textAlign: 'left',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 180ms ease, border-color 180ms ease',
  _before: {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, var(--tone), transparent 42%)',
    opacity: 0.06,
    pointerEvents: 'none',
  },
  _hover: {
    transform: 'translateY(-2px)',
    borderColor: 'var(--tone)',
  },
  _disabled: {
    cursor: 'default',
    opacity: 0.78,
    transform: 'none',
  },
});

const utilKickerClass = css({
  position: 'relative',
  fontFamily: 'mono',
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: 'var(--tone)',
});

const utilTitleClass = css({
  position: 'relative',
  fontFamily: 'display',
  fontSize: '18px',
  fontWeight: 'semibold',
  color: 'cream.200',
});

const utilSubClass = css({
  position: 'relative',
  pr: '5',
  fontFamily: 'mono',
  fontSize: '11px',
  lineHeight: 1.4,
  letterSpacing: '0.06em',
  color: 'cream.600',
});

const utilArrowClass = css({
  position: 'absolute',
  right: '4',
  bottom: '3.5',
  color: 'cream.600',
});

function DashboardRoute() {
  const navigate = useNavigate();
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: () => getDashboardFallbackSummary(),
  });
  const summary = summaryQuery.data ?? getDashboardFallbackSummary();
  const driverFirstName =
    summary.profile.driverLabel.split(/\s+/)[0] ?? 'Driver';

  const goPlan = () => {
    void navigate({ to: '/plan' });
  };

  const connectTesla = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/api/oauth/tesla/connect');
    }
  };

  return (
    <AppShell
      header={
        <Header
          sessionLabel={
            summary.tesla.status === 'linked'
              ? 'DASHBOARD · LIVE'
              : 'DASHBOARD · READY'
          }
          buildLabel="v1.0 BETA"
          showMeta
        />
      }
      background="full"
      stageTopAlign
    >
      <StageInner className={stageClass}>
        <nav className={navClass} aria-label="Dashboard sections">
          {['Home', 'Trips', 'Charge', 'Saved'].map((item) => (
            <button
              className={navButtonClass}
              type="button"
              key={item}
              onClick={item === 'Home' ? undefined : goPlan}
              aria-current={item === 'Home' ? 'page' : undefined}
            >
              {item}
            </button>
          ))}
        </nav>

        <Grid className={dashboardGridClass}>
          <Stack className={heroClass}>
            <Hero
              driverFirstName={driverFirstName}
              generatedAt={summary.generatedAt}
              onPlan={goPlan}
            />
            <QuickDestinations summary={summary} onPlan={goPlan} />
          </Stack>

          <Box className={carAreaClass}>
            <CarStatusPanel
              tesla={summary.tesla}
              isRefreshing={summaryQuery.isFetching}
              onRefresh={() => void summaryQuery.refetch()}
              onConnect={connectTesla}
            />
          </Box>

          <RecentTrips trips={summary.recentTrips} onPlan={goPlan} />
          <AgentFeed events={summary.activityFeed} />
          <UtilityTiles
            tiles={summary.utilities}
            onPlan={goPlan}
            onConnectTesla={connectTesla}
          />
        </Grid>
      </StageInner>
    </AppShell>
  );
}

function Hero({
  driverFirstName,
  generatedAt,
  onPlan,
}: {
  driverFirstName: string;
  generatedAt: string;
  onPlan: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const suggestion = useRotatingSuggestion();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onPlan();
    }
  };

  return (
    <Box className={heroClass}>
      <Box className={tagClass}>
        <Box as="span" className={pulseClass} />
        <Box as="span">EVAGENT · ONLINE</Box>
        <Box as="span" color="cream.700">
          ·
        </Box>
        <time dateTime={generatedAt}>{formatDashboardDate(generatedAt)}</time>
      </Box>

      <Text as="h1" className={titleClass}>
        Where are we
        <Box as="span" className={titleAccentClass}>
          {' '}
          headed
        </Box>
        ,<br />
        <Box as="span" className={titleNameClass}>
          {driverFirstName.toUpperCase()}
        </Box>
        ?
      </Text>

      <Box className={cx(panelClass, promptClass)}>
        <label className={promptPrefixClass} htmlFor="dashboard-prompt">
          Tell the agent
        </label>
        <textarea
          id="dashboard-prompt"
          className={promptInputClass}
          rows={2}
          value={prompt}
          placeholder={suggestion}
          onChange={(event) => setPrompt(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Box className={promptActionsClass}>
          <Box className={promptToolsClass} aria-label="Planning modifiers">
            {['Stop', 'Date', 'Vibe'].map((tool) => (
              <Box as="span" className={toolChipClass} key={tool}>
                + {tool}
              </Box>
            ))}
          </Box>
          <Button variant="primary" onClick={onPlan}>
            Plan a trip
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function QuickDestinations({
  summary,
  onPlan,
}: {
  summary: DashboardSummary;
  onPlan: () => void;
}) {
  return (
    <Box className={quickClass} aria-label="Quick destinations">
      <Box as="span" className={quickLabelClass}>
        Quick start ▸
      </Box>
      {summary.quickDestinations.map((destination) => (
        <button
          key={destination.id}
          className={quickChipClass}
          type="button"
          onClick={onPlan}
          style={toneStyle(destination.tone)}
        >
          <Box as="span" className={dotClass} />
          <Box as="span" className={quickTextClass}>
            {destination.label}
          </Box>
          <Box as="span" className={quickSubClass}>
            {destination.sub}
          </Box>
        </button>
      ))}
    </Box>
  );
}

function CarStatusPanel({
  tesla,
  isRefreshing,
  onRefresh,
  onConnect,
}: {
  tesla: DashboardTeslaSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  onConnect: () => void;
}) {
  const battery = tesla.vehicle?.batteryLevel ?? 0;
  const displayBattery = tesla.vehicle?.batteryLevel;
  const range = tesla.vehicle?.rangeMi;
  const odometer = tesla.vehicle?.odometerMi;
  const carName = tesla.vehicle?.displayName ?? 'Tesla integration';
  const shouldConnect = tesla.status === 'unlinked';

  return (
    <Box className={cx(panelClass, carPanelClass)}>
      <Box className={carHeadClass}>
        <Box as="span" className={sectionKickerClass}>
          Your car
        </Box>
        <Box className={statusPillClass}>
          <Box as="span" className={pulseClass} />
          {tesla.label}
        </Box>
      </Box>

      <Box className={carNameClass}>{carName}</Box>
      <Box className={carDetailClass}>{tesla.detail}</Box>

      <Box className={batteryRowClass}>
        <Box
          className={batteryFrameClass}
          aria-label={
            displayBattery === null
              ? 'Battery unavailable'
              : `Battery ${displayBattery}%`
          }
        >
          <Box
            className={batteryFillClass}
            style={{ '--battery': `${Math.max(6, battery)}%` } as CSSProperties}
          />
          <Box className={batterySegmentsClass} aria-hidden="true">
            {BATTERY_SEGMENTS.map((segment) => (
              <span key={segment} />
            ))}
          </Box>
        </Box>
        <Box className={batteryPctClass}>
          {displayBattery ?? '--'}
          <small>%</small>
        </Box>
      </Box>

      <Box className={carStatsClass}>
        <CarStat
          label="Range"
          value={range ? Math.round(range) : '--'}
          unit="mi"
        />
        <CarStat
          label="Odometer"
          value={odometer ? Math.round(odometer).toLocaleString() : '--'}
          unit="mi"
        />
        <CarStat
          label="State"
          value={
            tesla.vehicle?.state?.toUpperCase() ?? tesla.status.toUpperCase()
          }
        />
      </Box>

      <Box className={disabledActionRowClass}>
        <button className={disabledActionClass} type="button" disabled>
          Precondition soon
        </button>
        <button className={disabledActionClass} type="button" disabled>
          Unlock soon
        </button>
      </Box>

      <Box className={disabledActionRowClass}>
        {shouldConnect ? (
          <Button variant="primary" size="sm" onClick={onConnect}>
            Connect Tesla
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onRefresh}
            loading={isRefreshing}
            loadingText="Refreshing"
          >
            Refresh
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled>
          Read-only
        </Button>
      </Box>

      <Box className={carSvgWrapClass}>
        <CarSilhouette battery={battery} />
      </Box>
    </Box>
  );
}

function CarStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <Box className={carStatClass}>
      <Box className={carStatValueClass}>
        {value}
        {unit ? <small>{unit}</small> : null}
      </Box>
      <Box className={carStatLabelClass}>{label}</Box>
    </Box>
  );
}

function RecentTrips({
  trips,
  onPlan,
}: {
  trips: DashboardRecentTrip[];
  onPlan: () => void;
}) {
  return (
    <Box as="section" className={tripsAreaClass} aria-labelledby="recent-trips">
      <Box className={sectionHeadClass}>
        <Box as="span" className={sectionKickerClass}>
          Recent · {trips.length.toString().padStart(2, '0')} / 26
        </Box>
        <Text as="h2" id="recent-trips" className={sectionTitleClass}>
          Trips you&apos;ve taken
        </Text>
        <Text className={sectionSubClass}>
          Recall, remix, or share. Persistence hooks are ready for the next DB
          write path.
        </Text>
      </Box>

      <Box className={tripsGridClass}>
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPlan={onPlan} />
        ))}
      </Box>
    </Box>
  );
}

function TripCard({
  trip,
  onPlan,
}: {
  trip: DashboardRecentTrip;
  onPlan: () => void;
}) {
  return (
    <button
      type="button"
      className={tripCardClass}
      style={toneStyle(trip.tone)}
      onClick={onPlan}
    >
      <Box className={tripMapClass}>
        <TripMiniMap trip={trip} />
      </Box>
      <Box className={tripBodyClass}>
        <Box className={tripWhenClass}>{trip.when}</Box>
        <Text as="h3" className={tripTitleClass}>
          {trip.title}
        </Text>
        <Box className={tripMetaClass}>
          <span>{trip.from}</span>
          <span>→</span>
          <span>{trip.to}</span>
        </Box>
        <Box className={tripMetaClass}>
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
            <Box as="span" className={activityChipClass} key={activity}>
              {activity}
            </Box>
          ))}
        </Box>
      </Box>
    </button>
  );
}

function AgentFeed({ events }: { events: DashboardActivityEvent[] }) {
  return (
    <Box as="section" className={feedAreaClass} aria-labelledby="agent-feed">
      <Box className={cx(panelClass, feedClass)}>
        <Box className={feedHeadClass}>
          <Box as="span" id="agent-feed" className={sectionKickerClass}>
            Agent feed · live
          </Box>
          <Box as="span" className={statusPillClass}>
            <Box as="span" className={pulseClass} />
            Watching
          </Box>
        </Box>
        <Box as="ul" className={feedListClass}>
          {events.map((event) => (
            <Box
              as="li"
              className={feedRowClass}
              key={event.id}
              style={toneStyle(event.tone)}
            >
              <Box as="span" className={feedTimeClass}>
                {event.time}
              </Box>
              <Box as="span" className={feedBulletClass} aria-hidden="true">
                ▸
              </Box>
              <Box as="span" className={feedMessageClass}>
                {event.message}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function UtilityTiles({
  tiles,
  onPlan,
  onConnectTesla,
}: {
  tiles: DashboardUtilityTile[];
  onPlan: () => void;
  onConnectTesla: () => void;
}) {
  return (
    <Box
      as="section"
      className={utilsAreaClass}
      aria-label="Dashboard utilities"
    >
      {tiles.map((tile) => {
        const onClick =
          tile.action === 'plan'
            ? onPlan
            : tile.action === 'tesla-connect'
              ? onConnectTesla
              : undefined;
        return (
          <button
            type="button"
            className={utilTileClass}
            key={tile.id}
            style={toneStyle(tile.tone)}
            onClick={onClick}
            disabled={!onClick}
          >
            <Box as="span" className={utilKickerClass}>
              {tile.kicker}
            </Box>
            <Box as="span" className={utilTitleClass}>
              {tile.title}
            </Box>
            <Box as="span" className={utilSubClass}>
              {tile.sub}
            </Box>
            <Box as="span" className={utilArrowClass} aria-hidden="true">
              →
            </Box>
          </button>
        );
      })}
    </Box>
  );
}

function CarSilhouette({ battery }: { battery: number }) {
  return (
    <svg
      viewBox="0 0 320 80"
      width="100%"
      role="img"
      aria-label="Electric car silhouette"
    >
      <defs>
        <linearGradient id="dashboard-car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a6f" />
          <stop offset="1" stopColor="#1a1438" />
        </linearGradient>
        <linearGradient id="dashboard-car-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#ff9566" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff9566" stopOpacity="0.7" />
          <stop offset="1" stopColor="#e94a8c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="68" rx="130" ry="6" fill="#ff9566" opacity="0.18" />
      <path
        d="M30 56Q30 42 60 38L100 22Q110 16 130 16H200Q220 16 232 26L270 38Q290 40 290 56V60H30Z"
        fill="url(#dashboard-car-body)"
        stroke="#ff9566"
        strokeWidth="1.2"
      />
      <path
        d="M105 38L130 22H200L222 36Z"
        fill="#0f0a24"
        stroke="#d6ff3d"
        strokeWidth="0.8"
        opacity="0.85"
      />
      <circle
        cx="80"
        cy="60"
        r="9"
        fill="#0f0a24"
        stroke="#ff9566"
        strokeWidth="1.5"
      />
      <circle cx="80" cy="60" r="3" fill="#ff9566" />
      <circle
        cx="240"
        cy="60"
        r="9"
        fill="#0f0a24"
        stroke="#ff9566"
        strokeWidth="1.5"
      />
      <circle cx="240" cy="60" r="3" fill="#ff9566" />
      <line
        x1="40"
        y1="60"
        x2="280"
        y2="60"
        stroke="url(#dashboard-car-glow)"
        strokeWidth="2"
      />
      <rect
        x="252"
        y="40"
        width="14"
        height="6"
        rx="1.5"
        fill="none"
        stroke="#d6ff3d"
        strokeWidth="0.8"
      />
      <rect
        x="253"
        y="41"
        width={Math.max(2, battery * 0.12)}
        height="4"
        fill="#d6ff3d"
      />
    </svg>
  );
}

function TripMiniMap({ trip }: { trip: DashboardRecentTrip }) {
  const path = useMemo(() => {
    const seed = trip.id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const points = Array.from({ length: 5 }, (_, index) => {
      const drift = (Math.sin(seed * (index + 1)) + 1) / 2;
      const x = 12 + index * 24 + drift * 6 - 3;
      const y = 28 + Math.sin(index * 1.3 + drift * 4) * 18;
      return [x, y] as const;
    });

    return {
      points,
      d: `M ${points.map((point) => point.join(' ')).join(' L ')}`,
    };
  }, [trip.id]);

  return (
    <svg
      viewBox="0 0 120 60"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`dashboard-map-${trip.id}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M6 0L0 0 0 6"
            fill="none"
            stroke={toneColor[trip.tone]}
            strokeOpacity="0.12"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="120" height="60" fill={`url(#dashboard-map-${trip.id})`} />
      <path
        d={path.d}
        fill="none"
        stroke={toneColor[trip.tone]}
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path.d}
        fill="none"
        stroke={toneColor[trip.tone]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {path.points.map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={index === 0 || index === path.points.length - 1 ? 3.5 : 1.7}
          fill={
            index === 0 || index === path.points.length - 1
              ? '#1a1438'
              : '#d6ff3d'
          }
          stroke={
            index === 0 || index === path.points.length - 1
              ? toneColor[trip.tone]
              : undefined
          }
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function useRotatingSuggestion() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(
        (current) => (current + 1) % DASHBOARD_PROMPT_SUGGESTIONS.length,
      );
    }, 3500);

    return () => window.clearInterval(id);
  }, []);

  return DASHBOARD_PROMPT_SUGGESTIONS[
    index % DASHBOARD_PROMPT_SUGGESTIONS.length
  ];
}

function formatDashboardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}

function toneStyle(tone: keyof typeof toneColor): CSSProperties {
  return { '--tone': toneColor[tone] } as CSSProperties;
}
