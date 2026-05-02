import { useStore } from '@tanstack/react-form';
import { Crosshair, Flag, MapPin } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useMemo, useState } from 'react';
import { Box, Flex, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Icon from '#/components/Icon';
import Input from '#/components/Input';
import { Text } from '#/components/Text';
import type {
  PlanAddress,
  PlanCatalogResponse,
  PlanRequest,
} from '#/features/plan/contracts';
import { planRequestSchema } from '#/features/plan/contracts';
import { suggestPlanAddresses } from '#/features/plan/helpers';
import { usePlanForm } from '#/features/plan/usePlanForm';
import { css, cx } from '../../../styled-system/css';
import { chip } from '../../../styled-system/recipes/chip';
import { panel } from '../../../styled-system/recipes/panel';
import { sectionHeader } from '../../../styled-system/recipes/section-header';
import { selectableRow } from '../../../styled-system/recipes/selectable-row';
import ActivitySelector from './ActivitySelector';

type PlanFormProps = {
  catalog: PlanCatalogResponse;
  disabled?: boolean;
  onDraftChange?: (request: PlanRequest | null) => void;
  onBack?: () => void;
  onSubmit: (request: PlanRequest) => void;
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

const inputWrapClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  borderBottomWidth: 'med',
  borderBottomColor: 'alpha.cream.18',
  transition: 'border-color 0.2s ease',
  '&[data-focused=true]': {
    borderBottomColor: 'peach.400',
  },
});

const addrActionClass = css({
  width: 'control-sm',
  height: 'control-sm',
  minWidth: 'control-sm',
  minHeight: 'control-sm',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 'sm',
});

const addressInputClass = css({
  flex: 1,
  border: 'none',
  borderRadius: 0,
  background: 'transparent',
  boxShadow: 'none',
  px: 0,
  py: '2',
  fontFamily: 'display',
  fontSize: { base: 'address', md: 'xl' },
  fontWeight: '500',
  letterSpacing: '-0.01em',
  _focus: {
    boxShadow: 'none',
  },
});

const dropdownPositionClass = css({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  mt: '2',
  zIndex: 50,
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

export default function PlanForm({
  catalog,
  disabled = false,
  onDraftChange,
  onBack,
  onSubmit,
}: PlanFormProps) {
  const form = usePlanForm({ catalog, onSubmit, onDraftChange });
  const [fromLocked, setFromLocked] = useState(true);
  const values = useStore(form.store, (state) => state.values);
  const canPlan = useMemo(
    () => planRequestSchema.safeParse(values).success,
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

      <Stack gap="0">
        <form.Field name="from">
          {(field) => (
            <AddressField
              label="START"
              value={field.state.value.full}
              kind="start"
              action={
                fromLocked ? (
                  <Box
                    className={cx(
                      chip({ size: 'status', tone: 'charge' }),
                      autoChipClass,
                    )}
                  >
                    <Icon icon={Crosshair} size="xs" />
                    AUTO · FROM CAR
                  </Box>
                ) : null
              }
              onChange={(value) => {
                setFromLocked(false);
                field.handleChange({ full: value });
              }}
              onSelect={(address) => {
                setFromLocked(false);
                field.handleChange(address);
              }}
              onUseCar={() => {
                field.handleChange(catalog.carLocation);
                setFromLocked(true);
              }}
            />
          )}
        </form.Field>

        <form.Field name="to">
          {(field) => (
            <AddressField
              label="DESTINATION"
              value={field.state.value.full}
              kind="end"
              onChange={(value) => field.handleChange({ full: value })}
              onSelect={(address) => field.handleChange(address)}
            />
          )}
        </form.Field>

        <form.Field name="dates">
          {(field) => (
            <Box className={fieldClass}>
              <Box className={heroHeaderClasses.label}>DATES</Box>
              <Box className={chipRowClass}>
                {catalog.dateOptions.map((option) => {
                  const selected = field.state.value === option;
                  return (
                    <Button
                      key={option}
                      type="button"
                      unstyled
                      contentMode="custom"
                      className={chip({ size: 'compact', selected })}
                      aria-pressed={selected}
                      onClick={() => field.handleChange(option)}
                    >
                      {option}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          )}
        </form.Field>

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
                catalog={catalog.activities}
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

type AddressFieldProps = {
  label: string;
  value: string;
  kind: 'start' | 'end';
  action?: React.ReactNode;
  onChange: (value: string) => void;
  onSelect: (address: PlanAddress) => void;
  onUseCar?: () => void;
};

function AddressField({
  label,
  value,
  kind,
  action,
  onChange,
  onSelect,
  onUseCar,
}: AddressFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(() => suggestPlanAddresses(value), [value]);
  const fieldHeaderClasses = sectionHeader({ marker: kind });
  const rowClasses = selectableRow({ variant: 'suggestion' });
  const expanded = focused && suggestions.length > 0;
  const resolvedActiveIndex = expanded
    ? Math.min(Math.max(activeIndex, 0), suggestions.length - 1)
    : -1;
  const activeSuggestionId =
    resolvedActiveIndex >= 0
      ? `${listboxId}-${resolvedActiveIndex}`
      : undefined;

  useEffect(() => {
    setActiveIndex(expanded ? 0 : -1);
  }, [expanded]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!expanded) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === 'Enter' && resolvedActiveIndex >= 0) {
      event.preventDefault();
      onSelect(suggestions[resolvedActiveIndex]);
      setFocused(false);
      return;
    }

    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  return (
    <Box className={fieldClass}>
      <Box className={fieldHeaderClasses.label}>
        <Box className={fieldHeaderClasses.dot} />
        <span>{label}</span>
        {action}
      </Box>
      <Box className={inputWrapClass} data-focused={focused}>
        <Input
          value={value}
          className={addressInputClass}
          placeholder={
            kind === 'start'
              ? 'Current location · address · coordinates'
              : 'Where are you headed?'
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listboxId : undefined}
          aria-activedescendant={activeSuggestionId}
        />
        {onUseCar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Use car location"
            className={addrActionClass}
            onClick={onUseCar}
          >
            <Icon icon={Crosshair} size="sm" />
          </Button>
        ) : null}
      </Box>

      {expanded ? (
        <Box
          id={listboxId}
          role="listbox"
          className={cx(panel({ variant: 'dropdown' }), dropdownPositionClass)}
        >
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion.full}
              type="button"
              unstyled
              contentMode="custom"
              id={`${listboxId}-${index}`}
              role="option"
              className={rowClasses.row}
              aria-selected={resolvedActiveIndex === index}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
                setFocused(false);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Box className={rowClasses.icon}>
                <Icon icon={kind === 'start' ? MapPin : Flag} size="sm" />
              </Box>
              <Box className={rowClasses.body}>
                <Box className={rowClasses.primary}>
                  {suggestion.primary ?? suggestion.full}
                </Box>
                <Box className={rowClasses.secondary}>
                  {suggestion.secondary}
                </Box>
              </Box>
            </Button>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
