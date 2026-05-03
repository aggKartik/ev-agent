import { useStore } from '@tanstack/react-form';
import { Crosshair } from 'lucide-react';
import { useMemo } from 'react';
import { Box, Flex, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import Input from '#/components/ui/Input';
import { Text } from '#/components/ui/Text';
import { useCurrentLocation } from '#/features/plan/hooks/useCurrentLocation';
import {
  CONNECTOR_OPTION_ORDER,
  type PlanForm as PlanFormApi,
} from '#/features/plan/hooks/usePlanForm';
import { useLastPlanningError } from '#/features/plan/store';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import { planRequestSchema } from '#/shared/plan/contracts';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
import { css, cx } from '#/styled-system/css';
import { chip } from '#/styled-system/recipes/chip';
import { sectionHeader } from '#/styled-system/recipes/section-header';
import ActivitySelector from './ActivitySelector';
import NumericFormField from './NumericFormField';
import {
  PlanAddressField,
  planFormInputWrapClass,
  planFormTextInputClass,
} from './PlanAddressField';

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

const chipRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const actionsClass = css({
  mt: '8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  flexWrap: 'wrap',
});

const vehicleSublabelClass = css({
  fontSize: '2xs',
  color: 'cream.600',
  mb: '1',
  textStyle: 'mono-meta',
  letterSpacing: '0.12em',
});

export default function PlanForm({
  context,
  form,
  disabled = false,
  onBack,
}: PlanFormProps) {
  const lastPlanningError = useLastPlanningError();
  const values = useStore(form.store, (state) => state.values);
  const currentLocation = useCurrentLocation();
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
                const autoLabel =
                  currentLocation.source === 'tesla'
                    ? 'AUTO · FROM CAR'
                    : currentLocation.source === 'device'
                      ? 'AUTO · THIS DEVICE'
                      : null;
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
                      currentLocation.address
                        ? () => {
                            const addr = currentLocation.address;
                            if (!addr) return;
                            fromField.handleChange(addr);
                            lockedField.handleChange(true);
                          }
                        : undefined
                    }
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

        <Box className={fieldClass}>
          <Box className={heroHeaderClasses.label}>VEHICLE</Box>
          <Flex gap="4" flexWrap="wrap" alignItems="flex-end">
            <form.Field name="vehicleLabel">
              {(field) => (
                <Box flex="1" minWidth="200px" width="full">
                  <Box className={vehicleSublabelClass}>MODEL</Box>
                  <Box className={planFormInputWrapClass} data-focused={false}>
                    <Input
                      value={field.state.value}
                      className={planFormTextInputClass}
                      placeholder="e.g. Tesla Model 3 Long Range"
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </Box>
                </Box>
              )}
            </form.Field>
            <form.Field name="usableRangeMiles">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="RANGE (MI)"
                  min={1}
                  max={500}
                />
              )}
            </form.Field>
          </Flex>
          <Flex gap="4" flexWrap="wrap" alignItems="flex-end" mt="4">
            <form.Field name="startingSocPercent">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="START SOC %"
                  min={0}
                  max={100}
                />
              )}
            </form.Field>
            <form.Field name="targetArrivalSocPercent">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="ARRIVE % MIN"
                  min={0}
                  max={100}
                />
              )}
            </form.Field>
            <form.Field name="batteryCapacityKWh">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="PACK (KW·H)"
                  min={10}
                  max={250}
                  inputMode="decimal"
                />
              )}
            </form.Field>
            <form.Field name="consumptionWhPerMile">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="WH/MI"
                  min={100}
                  max={800}
                  step={5}
                  inputMode="decimal"
                />
              )}
            </form.Field>
            <form.Field name="postChargeSocPercent">
              {(field) => (
                <NumericFormField
                  field={field}
                  label="AFTER DCFC %"
                  min={50}
                  max={100}
                />
              )}
            </form.Field>
          </Flex>
          <form.Field name="connectorTypes">
            {(field) => (
              <Box mt="4">
                <Box className={vehicleSublabelClass}>CONNECTORS</Box>
                <Box className={chipRowClass}>
                  {CONNECTOR_OPTION_ORDER.map((slug) => {
                    const selected = field.state.value.includes(slug);
                    return (
                      <Button
                        key={slug}
                        type="button"
                        unstyled
                        contentMode="custom"
                        className={chip({ size: 'compact', selected })}
                        aria-pressed={selected}
                        onClick={() => {
                          const current = field.state.value;
                          if (selected && current.length <= 1) return;
                          if (selected) {
                            field.handleChange(
                              current.filter((x) => x !== slug),
                            );
                          } else {
                            field.handleChange([...current, slug]);
                          }
                        }}
                      >
                        {slug}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
          </form.Field>
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
