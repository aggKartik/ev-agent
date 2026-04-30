import { Crosshair, Flag, MapPin } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useMemo, useState } from 'react';
import { Box, Flex, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Icon from '#/components/Icon';
import Input from '#/components/Input';
import { Text } from '#/components/Text';
import type {
  PlanActivitySelection,
  PlanAddress,
  PlanCatalogResponse,
  PlanRequest,
} from '#/features/plan/contracts';
import { suggestPlanAddresses } from '#/features/plan/helpers';
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
  maxWidth: 'plan-form',
  justifySelf: 'end',
  alignSelf: 'stretch',
  px: '0',
  pt: '0',
  pb: '6',
  '@media (min-width: 880px)': {
    px: 'plan-form-x',
    pt: '2.5',
    pb: 'plan-form-bottom',
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
  const [from, setFrom] = useState<PlanAddress>(catalog.carLocation);
  const [fromLocked, setFromLocked] = useState(true);
  const [to, setTo] = useState<PlanAddress>({ full: '' });
  const [dates, setDates] = useState(catalog.dateOptions[0] ?? 'Flexible');
  const [activities, setActivities] = useState<PlanActivitySelection[]>([]);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  const fromSuggestions = useMemo(
    () => suggestPlanAddresses(from.full),
    [from.full],
  );
  const toSuggestions = useMemo(() => suggestPlanAddresses(to.full), [to.full]);
  const canPlan =
    from.full.trim().length > 0 &&
    to.full.trim().length > 0 &&
    activities.length > 0;
  const draftRequest = useMemo(
    () =>
      from.full.trim().length > 0 ? { from, to, dates, activities } : null,
    [activities, dates, from, to],
  );

  useEffect(() => {
    onDraftChange?.(draftRequest);
  }, [draftRequest, onDraftChange]);

  const submit = () => {
    if (!canPlan || disabled) return;
    onSubmit({ from, to, dates, activities });
  };

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
        <AddressField
          label="START"
          value={from.full}
          focused={fromFocused}
          kind="start"
          suggestions={fromSuggestions}
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
          onFocus={() => setFromFocused(true)}
          onBlur={() => setTimeout(() => setFromFocused(false), 160)}
          onChange={(value) => {
            setFromLocked(false);
            setFrom({ full: value });
          }}
          onSelect={(address) => {
            setFromLocked(false);
            setFrom(address);
            setFromFocused(false);
          }}
          onUseCar={() => {
            setFrom(catalog.carLocation);
            setFromLocked(true);
          }}
        />

        <AddressField
          label="DESTINATION"
          value={to.full}
          focused={toFocused}
          kind="end"
          suggestions={toSuggestions}
          onFocus={() => setToFocused(true)}
          onBlur={() => setTimeout(() => setToFocused(false), 160)}
          onChange={(value) => setTo({ full: value })}
          onSelect={(address) => {
            setTo(address);
            setToFocused(false);
          }}
        />

        <Box className={fieldClass}>
          <Box className={heroHeaderClasses.label}>DATES</Box>
          <Box className={chipRowClass}>
            {catalog.dateOptions.map((option) => {
              const selected = dates === option;
              return (
                <Button
                  key={option}
                  type="button"
                  unstyled
                  contentMode="custom"
                  className={chip({ size: 'compact', selected })}
                  aria-pressed={selected}
                  onClick={() => setDates(option)}
                >
                  {option}
                </Button>
              );
            })}
          </Box>
        </Box>

        <Box className={fieldClass}>
          <Flex
            className={heroHeaderClasses.label}
            justifyContent="space-between"
          >
            <span>ACTIVITIES · PICK & SET TIME</span>
            <span>{activities.length} SELECTED</span>
          </Flex>
          <ActivitySelector
            catalog={catalog.activities}
            value={activities}
            onChange={setActivities}
          />
        </Box>

        <Box className={actionsClass}>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            disabled={!canPlan || disabled}
            loading={disabled}
            onClick={submit}
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
  focused: boolean;
  kind: 'start' | 'end';
  suggestions: PlanAddress[];
  action?: React.ReactNode;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onSelect: (address: PlanAddress) => void;
  onUseCar?: () => void;
};

function AddressField({
  label,
  value,
  focused,
  kind,
  suggestions,
  action,
  onFocus,
  onBlur,
  onChange,
  onSelect,
  onUseCar,
}: AddressFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const [activeIndex, setActiveIndex] = useState(-1);
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
          onFocus={onFocus}
          onBlur={onBlur}
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
