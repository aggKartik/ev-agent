import { Crosshair, Flag, MapPin } from 'lucide-react';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import Input from '#/components/ui/Input';
import type { Coordinate } from '#/lib/geoTypes';
import { trpc } from '#/lib/trpc';
import type { PlanAddress } from '#/shared/plan/contracts';
import { css, cx } from '#/styled-system/css';
import { panel } from '#/styled-system/recipes/panel';
import { sectionHeader } from '#/styled-system/recipes/section-header';
import { selectableRow } from '#/styled-system/recipes/selectable-row';

/** Shared underline input row (start/end fields + vehicle row). */
const planFormInputWrapClass = css({
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

/** Shared large display input (addresses + vehicle model / numbers). */
const planFormTextInputClass = css({
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

const planAddressFieldRootClass = css({
  position: 'relative',
  mb: '5',
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

const dropdownPositionClass = css({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  mt: '2',
  zIndex: 50,
});

const SUGGEST_DEBOUNCE_MS = 150;

function generateSessionToken(): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto?.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `s_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type PlanAddressFieldProps = {
  label: string;
  value: string;
  kind: 'start' | 'end';
  /**
   * Bias suggestions toward this point (typically the **Driver**'s
   * resolved current location, or the other end of the trip).
   */
  proximity?: Coordinate;
  action?: React.ReactNode;
  onChange: (value: string) => void;
  onSelect: (address: PlanAddress) => void;
  onUseCar?: () => void;
};

export function PlanAddressField({
  label,
  value,
  kind,
  proximity,
  action,
  onChange,
  onSelect,
  onUseCar,
}: PlanAddressFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const sessionTokenRef = useRef<string>(generateSessionToken());

  // Debounce typing -> Mapbox suggest call so we don't bill on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(value);
    }, SUGGEST_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value]);

  const shouldFetchSuggestions = focused && debouncedQuery.trim().length >= 2;

  const suggestQuery = trpc.plan.suggestAddresses.useQuery(
    {
      query: debouncedQuery,
      sessionToken: sessionTokenRef.current,
      proximity,
    },
    {
      enabled: shouldFetchSuggestions,
      staleTime: 60_000,
    },
  );

  const suggestions = useMemo(() => {
    if (!shouldFetchSuggestions) return [];
    return suggestQuery.data ?? [];
  }, [shouldFetchSuggestions, suggestQuery.data]);

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

  const utils = trpc.useUtils();

  const retrieveAndSelect = useCallback(
    async (providerId: string) => {
      const sessionToken = sessionTokenRef.current;
      try {
        const address = await utils.plan.retrieveAddress.fetch({
          providerId,
          sessionToken,
        });
        // Mapbox bills `retrieve` per session — rotate the token after the
        // session closes so the next focus opens a new (free) suggest run.
        sessionTokenRef.current = generateSessionToken();
        if (address) {
          onSelect(address);
        }
      } catch (err) {
        console.error('plan.retrieveAddress failed', err);
      }
    },
    [onSelect, utils.plan.retrieveAddress],
  );

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
      const target = suggestions[resolvedActiveIndex];
      void retrieveAndSelect(target.providerId);
      setFocused(false);
      return;
    }

    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  const fieldHeaderClasses = sectionHeader({ marker: kind });
  const rowClasses = selectableRow({ variant: 'suggestion' });

  return (
    <Box className={planAddressFieldRootClass}>
      <Box className={fieldHeaderClasses.label}>
        <Box className={fieldHeaderClasses.dot} />
        <span>{label}</span>
        {action}
      </Box>
      <Box className={planFormInputWrapClass} data-focused={focused}>
        <Input
          value={value}
          className={planFormTextInputClass}
          placeholder={
            kind === 'start'
              ? 'Address, place, or coordinates'
              : 'Where are you headed?'
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          onChange={(event) => {
            // Treat typing as evidence of focus too — assistive tech and
            // some test runners can update the value without firing focus
            // events first, which would otherwise prevent the suggestions
            // dropdown from opening.
            setFocused(true);
            onChange(event.target.value);
          }}
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
              key={suggestion.providerId}
              type="button"
              unstyled
              contentMode="custom"
              id={`${listboxId}-${index}`}
              role="option"
              className={rowClasses.row}
              aria-selected={resolvedActiveIndex === index}
              onMouseDown={(event) => {
                event.preventDefault();
                void retrieveAndSelect(suggestion.providerId);
                setFocused(false);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Box className={rowClasses.icon}>
                <Icon icon={kind === 'start' ? MapPin : Flag} size="sm" />
              </Box>
              <Box className={rowClasses.body}>
                <Box className={rowClasses.primary}>{suggestion.primary}</Box>
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
