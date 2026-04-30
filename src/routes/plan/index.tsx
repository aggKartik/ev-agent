import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Box, Grid, Stack } from 'styled-system/jsx';
import Header from '#/components/Header';
import AppShell from '#/components/layout/AppShell';
import ItineraryDrawer from '#/components/plan/ItineraryDrawer';
import PlanForm from '#/components/plan/PlanForm';
import PlanningLog from '#/components/plan/PlanningLog';
import RouteMap from '#/components/plan/RouteMap';
import { emptyOnboardingSearch } from '#/features/onboarding/search';
import type { PlanRequest, PlanResult } from '#/features/plan/contracts';
import { getPlanCatalog } from '#/features/plan/helpers';
import { trpc } from '#/lib/trpc';
import { css, cx } from '../../../styled-system/css';

export const Route = createFileRoute('/plan/')({
  component: PlanRoute,
});

const stageClass = css({
  maxWidth: 'none',
  alignItems: 'stretch',
  gap: '0',
  px: '0',
});

const itineraryStageClass = css({
  maxWidth: 'none',
  height: 'full',
});

const plannerGridClass = css({
  width: 'full',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '0',
  alignItems: 'stretch',
  '@media (min-width: 880px)': {
    gridTemplateColumns: 'minmax(420px, 1fr) minmax(420px, 46vw)',
  },
});

const mapColumnClass = css({
  minHeight: '420px',
  p: '0',
  order: -1,
  '@media (min-width: 880px)': {
    minHeight: 'calc(100dvh - 68px)',
    height: 'calc(100dvh - 68px)',
    p: '10px 20px 20px 10px',
    order: 0,
  },
});

const itineraryShellClass = css({
  position: 'relative',
  width: 'full',
  height: { base: 'auto', lg: 'calc(100dvh - 146px)' },
  minHeight: { base: '720px', lg: '560px' },
});

const itineraryMapClass = css({
  position: 'absolute',
  inset: 0,
});

const itineraryDrawerClass = css({
  position: { base: 'relative', lg: 'absolute' },
  zIndex: 5,
  top: { lg: '20px' },
  left: { lg: '20px' },
  bottom: { lg: '20px' },
  width: { base: 'full', lg: '420px' },
  maxWidth: { base: 'full', lg: 'calc(100% - 40px)' },
  p: { base: '4', lg: '0' },
});

function PlanRoute() {
  const navigate = useNavigate();
  const catalogQuery = trpc.plan.catalog.useQuery(undefined, {
    initialData: getPlanCatalog,
    staleTime: 5 * 60_000,
  });
  const createPlan = trpc.plan.create.useMutation();
  const [draftRequest, setDraftRequest] = useState<PlanRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<PlanRequest | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [status, setStatus] = useState<'draft' | 'planning' | 'ready'>('draft');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const submitPlan = useCallback(
    async (request: PlanRequest) => {
      setActiveRequest(request);
      setDraftRequest(request);
      setStatus('planning');
      setPhaseIndex(0);
      setSelectedStopId(null);
      const nextResult = await createPlan.mutateAsync(request);
      setResult(nextResult);
    },
    [createPlan],
  );

  useEffect(() => {
    if (status !== 'planning' || !result) return;

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => {
        if (current >= result.phases.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setStatus('ready');
            setSelectedStopId(
              result.stops.find((stop) => stop.kind === 'activity')?.id ??
                result.stops[0]?.id ??
                null,
            );
          }, 500);
          return current;
        }
        return current + 1;
      });
    }, 720);

    return () => window.clearInterval(interval);
  }, [result, status]);

  const revealCount =
    status === 'planning' && result
      ? Math.max(
          2,
          Math.ceil(
            ((phaseIndex + 1) / result.phases.length) * result.stops.length,
          ),
        )
      : undefined;
  const mapMode =
    status === 'planning'
      ? 'building'
      : status === 'ready'
        ? 'ready'
        : 'preview';
  const mapRequest = activeRequest ?? draftRequest;

  return (
    <AppShell
      header={
        <Header
          sessionLabel={
            status === 'ready'
              ? 'TRIP · READY'
              : status === 'planning'
                ? 'TRIP · PLANNING'
                : 'TRIP · NEW'
          }
          buildLabel="v1.0 BETA"
          showMeta
        />
      }
      background="horizon-only"
      stageTopAlign
    >
      <Box
        className={cx(
          stageClass,
          status === 'ready' ? itineraryStageClass : undefined,
        )}
        style={status === 'ready' ? undefined : { marginTop: '-38px' }}
      >
        {status === 'ready' && result ? (
          <Box className={itineraryShellClass}>
            <Box className={itineraryMapClass}>
              <RouteMap
                request={mapRequest}
                result={result}
                revealCount={revealCount}
                selectedStopId={selectedStopId}
                mode={mapMode}
                onSelectStop={setSelectedStopId}
              />
            </Box>
            <Box className={itineraryDrawerClass}>
              <ItineraryDrawer
                result={result}
                selectedStopId={selectedStopId}
                onSelectStop={setSelectedStopId}
              />
            </Box>
          </Box>
        ) : (
          <Grid
            className={plannerGridClass}
            style={{
              width: 'calc(100% + 138px)',
              transform: 'translateX(-69px)',
            }}
          >
            {status === 'planning' && result && activeRequest ? (
              <PlanningLog
                request={activeRequest}
                result={result}
                phaseIndex={phaseIndex}
              />
            ) : (
              <PlanForm
                catalog={catalogQuery.data}
                disabled={createPlan.isPending}
                onDraftChange={setDraftRequest}
                onBack={() => {
                  void navigate({
                    to: '/onboarding',
                    search: emptyOnboardingSearch,
                  });
                }}
                onSubmit={submitPlan}
              />
            )}

            <Stack className={mapColumnClass}>
              <RouteMap
                request={mapRequest}
                result={result}
                revealCount={revealCount}
                selectedStopId={selectedStopId}
                mode={mapMode}
                onSelectStop={setSelectedStopId}
              />
            </Stack>
          </Grid>
        )}
      </Box>
    </AppShell>
  );
}
