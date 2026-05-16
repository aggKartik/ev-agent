import { useStore } from '@tanstack/react-form';
import { Crosshair } from 'lucide-react';
import { useMemo } from 'react';
import { Box, Flex, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import { Text } from '#/components/ui/Text';
import { useAutoFillCurrentLocation } from '#/features/plan/hooks/useAutoFillCurrentLocation';
import { useCurrentLocation } from '#/features/plan/hooks/useCurrentLocation';
import type { PlanForm as PlanFormApi } from '#/features/plan/hooks/usePlanForm';
import { useSyncPlanVehicleFieldsFromContext } from '#/features/plan/hooks/useSyncPlanVehicleFieldsFromContext';
import { useLastPlanningError } from '#/features/plan/store';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import { planRequestSchema } from '#/shared/plan/contracts';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
import { css, cx } from '#/styled-system/css';
import { chip } from '#/styled-system/recipes/chip';
import { sectionHeader } from '#/styled-system/recipes/section-header';
import ActivitySelector from './ActivitySelector';
import { PlanAddressField } from './PlanAddressField';

type PlanFormProps = {
  context: PlanContextResponse<VehicleEnergyProfile | null>;
  form: PlanFormApi;
  disabled?: boolean;
  onBack?: () => void;
};

const panelClass = css({
  width: 'full',
  maxWidth: 'panel-form',
  justifySelf: 'end',
  alignSelf: 'stretch',
  px: '0',
  pt: '0',
  pb: '6',
  '@media (min-width: 880px)': {
    px: '44px',
    pt: '2.5',
    pb: '60px',
    height: 'calc(100dvh - 96px)',
    maxHeight: 'calc(100dvh - 96px)',
    overflowY: 'auto',
    scrollbarGutter: 'stable',
  },
});

const heroHeaderClasses = sectionHeader();

const fieldClass = css({
  position: 'relative',
  mb: '5',
});

const autoChipClass = css({
  marginLeft: 'auto',
});

const actionsClass = css({
  mt: '8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  flexWrap: 'wrap',
});

const vehicleInfoPanelClass = css({
  marginBottom: '5',
  padding: '3',
  borderRadius: 'md',
  borderWidth: '1px',
  borderColor: 'alpha.cream-28',
  background:
    'linear-gradient(160deg, rgba(245, 234, 208, 0.05), rgba(123, 75, 209, 0.06))',
  maxWidth: 'panel-form',
});

type CurrentLocationActionState = {
  autoLabel: string | null;
  canUseCurrentLocation: boolean;
  showCurrentLocationAction: boolean;
  useCurrentLocationLabel: string;
};

function getCurrentLocationActionState(
  currentLocation: ReturnType<typeof useCurrentLocation>,
): CurrentLocationActionState {
  const canUseCurrentLocation = Boolean(currentLocation.address?.coordinate);
  const sourceLabel =
    currentLocation.source === 'tesla'
      ? 'AUTO · FROM CAR'
      : currentLocation.source === 'device'
        ? 'AUTO · THIS DEVICE'
        : null;
  const useCurrentLocationLabel = currentLocation.isPending
    ? 'Locating car or device'
    : currentLocation.source === 'device'
      ? 'Use current device location'
      : 'Use car location';

  return {
    autoLabel: sourceLabel,
    canUseCurrentLocation,
    showCurrentLocationAction:
      canUseCurrentLocation || currentLocation.isPending,
    useCurrentLocationLabel,
  };
}

export default function PlanForm({
  context,
  form,
  disabled = false,
  onBack,
}: PlanFormProps) {
  const lastPlanningError = useLastPlanningError();
  const values = useStore(form.store, (state) => state.values);
  const currentLocation = useCurrentLocation();

  useSyncPlanVehicleFieldsFromContext(context, form);
  useAutoFillCurrentLocation(form, currentLocation);

  const canPlan = useMemo(
    () =>
      planRequestSchema.safeParse({
        from: values.from,
        to: values.to,
        activities: values.activities,
        vehicleLabel: values.vehicleLabel,
        usableRangeMiles: values.usableRangeMiles,
        startingSocPercent: values.startingSocPercent,
        targetArrivalSocPercent: values.targetArrivalSocPercent,
        batteryCapacityKWh: values.batteryCapacityKWh,
        consumptionWhPerMile: values.consumptionWhPerMile,
        connectorTypes: values.connectorTypes,
        postChargeSocPercent: values.postChargeSocPercent,
      }).success,
    [values],
  );

  return (
    <Box className={panelClass}>
      <Box className={heroHeaderClasses.kicker}>PLAN · A · TRIP</Box>
      <Text as="h1" className={heroHeaderClasses.title}>
        Where to, <em>friend?</em>
      </Text>
      <Text className={heroHeaderClasses.desc}>
        We'll route charging around the vibe — not the other way around. Set
        start, end, and the kinds of detours you care about.
      </Text>

      {lastPlanningError ? (
        <Box
          role="alert"
          marginBottom="4"
          marginTop="2"
          padding="3"
          borderRadius="md"
          borderWidth="1px"
          borderColor="magenta.400"
          background="alpha.cream-06"
          maxWidth="panel-form"
        >
          <Text textStyle="caption" color="magenta.300">
            {lastPlanningError}
          </Text>
        </Box>
      ) : null}

      <Stack gap="0">
        <form.Field name="from">
          {(fromField) => (
            <form.Field name="fromLocked">
              {(lockedField) => {
                const {
                  autoLabel,
                  showCurrentLocationAction,
                  useCurrentLocationLabel,
                } = getCurrentLocationActionState(currentLocation);
                return (
                  <PlanAddressField
                    label="START"
                    value={fromField.state.value.full}
                    kind="start"
                    proximity={
                      fromField.state.value.coordinate ??
                      currentLocation.address?.coordinate
                    }
                    action={
                      lockedField.state.value && autoLabel ? (
                        <Box
                          className={cx(
                            chip({ size: 'status', tone: 'charge' }),
                            autoChipClass,
                          )}
                        >
                          <Icon icon={Crosshair} size="xs" />
                          {autoLabel}
                        </Box>
                      ) : null
                    }
                    onChange={(value) => {
                      lockedField.handleChange(false);
                      fromField.handleChange({ full: value });
                    }}
                    onSelect={(address) => {
                      lockedField.handleChange(false);
                      fromField.handleChange(address);
                    }}
                    onUseCar={
                      showCurrentLocationAction
                        ? () => {
                            const addr = currentLocation.address;
                            if (!addr?.coordinate) return;
                            fromField.handleChange(addr);
                            lockedField.handleChange(true);
                          }
                        : undefined
                    }
                    useCarDisabled={currentLocation.isPending}
                    useCarLabel={useCurrentLocationLabel}
                    useCarLoading={currentLocation.isPending}
                  />
                );
              }}
            </form.Field>
          )}
        </form.Field>

        <form.Field name="to">
          {(field) => (
            <PlanAddressField
              label="DESTINATION"
              value={field.state.value.full}
              kind="end"
              proximity={
                currentLocation.address?.coordinate ?? values.from.coordinate
              }
              onChange={(value) => field.handleChange({ full: value })}
              onSelect={(address) => field.handleChange(address)}
            />
          )}
        </form.Field>

        <Box className={vehicleInfoPanelClass}>
          <Text
            as="p"
            textStyle="mono-meta"
            fontSize="2xs"
            color="cream.600"
            letterSpacing="0.14em"
            marginBottom="2"
          >
            YOUR CAR · USED FOR ROUTING
          </Text>
          <Text as="p" textStyle="caption" color="cream.500" lineHeight="1.6">
            <Text as="span" fontWeight="semibold" color="cream.200">
              {values.vehicleLabel}
            </Text>
            {' — '}
            {Math.round(values.usableRangeMiles)} mi usable range,{' '}
            {values.batteryCapacityKWh} kWh pack,{' '}
            {Math.round(values.consumptionWhPerMile)} Wh/mi. Connectors:{' '}
            {[...values.connectorTypes].sort().join(', ')}. The planner assumes{' '}
            <Text as="span" fontWeight="semibold" color="cream.300">
              {values.startingSocPercent}%
            </Text>{' '}
            starting charge
            {context.liveBatteryPercent != null
              ? ' (live from Tesla)'
              : ' (profile default until your car reports charge)'}
            , arriving with at least{' '}
            <Text as="span" fontWeight="semibold" color="cream.300">
              {values.targetArrivalSocPercent}%
            </Text>{' '}
            remaining, and targeting{' '}
            <Text as="span" fontWeight="semibold" color="cream.300">
              {values.postChargeSocPercent}%
            </Text>{' '}
            after each DC fast-charge stop. Nothing here is editable — it all
            comes from your linked vehicle.
          </Text>
        </Box>

        <form.Field name="activities">
          {(field) => (
            <Box className={fieldClass}>
              <Flex
                className={heroHeaderClasses.label}
                justifyContent="space-between"
              >
                <span>ACTIVITIES · PICK & SET TIME</span>
                <span>{field.state.value.length} SELECTED</span>
              </Flex>
              <ActivitySelector
                catalog={context.activities}
                value={field.state.value}
                onChange={field.handleChange}
              />
            </Box>
          )}
        </form.Field>

        <Box className={actionsClass}>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            disabled={!canPlan || disabled}
            loading={disabled}
            onClick={() => {
              void form.handleSubmit();
            }}
          >
            Plan my trip
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
