import { Crosshair, Flag, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { css } from '../../../styled-system/css';
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
  maxWidth: '720px',
  justifySelf: 'end',
  alignSelf: 'stretch',
  px: '0',
  pt: '0',
  pb: '6',
  '@media (min-width: 880px)': {
    px: '44px',
    pt: '10px',
    pb: '60px',
  },
});

const kickerClass = css({
  textStyle: 'mono-kicker',
  color: 'peach.400',
  letterSpacing: '0.28em',
  mb: '3.5',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2.5',
  _before: {
    content: '""',
    width: '22px',
    height: '1px',
    background: 'peach.400',
  },
});

const titleClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: { base: '38px', md: '56px' },
  lineHeight: '1.02',
  letterSpacing: '-0.03em',
  color: 'cream.100',
  mb: '3.5',
  '& em': {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontWeight: '400',
    background:
      'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
    backgroundClip: 'text',
    color: 'transparent',
  },
});

const subClass = css({
  maxWidth: '540px',
  color: 'cream.600',
  fontSize: '15px',
  lineHeight: '1.55',
  mb: '8',
});

const fieldClass = css({
  position: 'relative',
  mb: '5',
});

const labelClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  textStyle: 'mono-meta',
  fontSize: '10px',
  color: 'cream.600',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  mb: '2.5',
});

const dotClass = css({
  width: '8px',
  height: '8px',
  borderRadius: 'full',
  background: 'peach.400',
  boxShadow: '0 0 8px {colors.peach.400}',
  '&[data-kind=end]': {
    background: 'magenta.400',
    boxShadow: '0 0 8px {colors.magenta.400}',
  },
});

const autoChipClass = css({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  px: '2',
  py: '1',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.lime.30',
  background: 'rgba(214, 255, 61, 0.06)',
  color: 'lime.300',
  fontSize: '9px',
});

const inputWrapClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  borderBottomWidth: '2px',
  borderBottomColor: 'alpha.cream.18',
  transition: 'border-color 0.2s ease',
  '&[data-focused=true]': {
    borderBottomColor: 'peach.400',
  },
});

const addrActionClass = css({
  width: '32px',
  height: '32px',
  minWidth: '32px',
  minHeight: '32px',
  padding: 0,
  borderRadius: '8px',
  '& > span': {
    gap: 0,
  },
  '& [data-part=leading-icon], & [data-part=trailing-icon]': {
    display: 'none',
  },
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
  fontSize: { base: '19px', md: '22px' },
  fontWeight: '500',
  letterSpacing: '-0.01em',
  _focus: {
    boxShadow: 'none',
  },
});

const dropdownClass = css({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  mt: '2',
  zIndex: 50,
  overflow: 'hidden',
  borderWidth: '1px',
  borderColor: 'alpha.cream.18',
  borderRadius: '16px',
  background: 'rgba(15, 10, 36, 0.96)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
});

const suggestRowClass = css({
  width: 'full',
  display: 'flex',
  alignItems: 'center',
  gap: '3.5',
  p: '3.5',
  color: 'cream.100',
  borderBottomWidth: '1px',
  borderBottomColor: 'alpha.cream.06',
  '& > span': {
    width: 'full',
    display: 'block',
  },
  '& > span > span:not([data-part])': {
    width: 'full',
    display: 'flex',
    alignItems: 'center',
    gap: '3.5',
  },
  '& [data-part=leading-icon], & [data-part=trailing-icon]': {
    display: 'none',
  },
  _hover: {
    background: 'rgba(255, 149, 102, 0.08)',
  },
});

const suggestIconClass = css({
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '9px',
  background: 'rgba(255, 149, 102, 0.12)',
  color: 'peach.400',
  flexShrink: 0,
});

const primaryClass = css({
  fontSize: '14px',
  fontWeight: '600',
});

const secondaryClass = css({
  textStyle: 'mono-meta',
  fontSize: '10px',
  color: 'cream.600',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  mt: '0.5',
});

const chipRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const chipClass = css({
  px: '2.5',
  py: '1.5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream.18',
  background: 'rgba(245, 234, 208, 0.03)',
  color: 'cream.200',
  fontSize: '11px',
  fontWeight: '600',
  _hover: {
    borderColor: 'peach.400',
  },
  '&[data-selected=true]': {
    borderColor: 'transparent',
    background:
      'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
    color: 'night.800',
  },
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
      <Box className={kickerClass}>PLAN · A · TRIP</Box>
      <Text as="h1" className={titleClass}>
        Where to, <em>friend?</em>
      </Text>
      <Text className={subClass}>
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
              <Box className={autoChipClass}>
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
          <Box className={labelClass}>DATES</Box>
          <Box className={chipRowClass}>
            {catalog.dateOptions.map((option) => (
              <Button
                key={option}
                type="button"
                unstyled
                className={chipClass}
                data-selected={dates === option}
                onClick={() => setDates(option)}
              >
                {option}
              </Button>
            ))}
          </Box>
        </Box>

        <Box className={fieldClass}>
          <Flex className={labelClass} justifyContent="space-between">
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
  return (
    <Box className={fieldClass}>
      <Box className={labelClass}>
        <Box className={dotClass} data-kind={kind} />
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
        />
        {onUseCar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Use car location"
            className={addrActionClass}
            onClick={onUseCar}
          >
            <Icon icon={Crosshair} size="sm" />
          </Button>
        ) : null}
      </Box>

      {focused && suggestions.length > 0 ? (
        <Box className={dropdownClass}>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.full}
              type="button"
              unstyled
              className={suggestRowClass}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
              }}
            >
              <Box className={suggestIconClass}>
                <Icon icon={kind === 'start' ? MapPin : Flag} size="sm" />
              </Box>
              <Box>
                <Box className={primaryClass}>
                  {suggestion.primary ?? suggestion.full}
                </Box>
                <Box className={secondaryClass}>{suggestion.secondary}</Box>
              </Box>
            </Button>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
