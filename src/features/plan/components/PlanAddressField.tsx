import { Crosshair, Flag, MapPin } from 'lucide-react';
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import Input from '#/components/ui/Input';
import type { Coordinate } from '#/lib/geoTypes';
import { trpc } from '#/lib/trpc';
import type { AddressSuggestion } from '#/server/capabilities/addresses/domain/types';
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
  useCarLoading?: boolean;
  useCarDisabled?: boolean;
  useCarLabel?: string;
};

type AddressFieldKind = PlanAddressFieldProps['kind'];

type SuggestionState = {
  expanded: boolean;
  suggestions: AddressSuggestion[];
  resolvedActiveIndex: number;
  activeSuggestionId: string | undefined;
  showLoadingRow: boolean;
};

type FieldEventHandlers = {
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function useDebouncedQuery(value: string): string {
  const [debouncedQuery, setDebouncedQuery] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(value);
    }, SUGGEST_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value]);

  return debouncedQuery;
}

function useRetrieveAddress(onSelect: (address: PlanAddress) => void) {
  const utils = trpc.useUtils();
  const sessionTokenRef = useRef<string>(generateSessionToken());

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
        if (address) onSelect(address);
      } catch (err) {
        console.error('plan.retrieveAddress failed', err);
      }
    },
    [onSelect, utils.plan.retrieveAddress],
  );

  return { retrieveAndSelect, sessionTokenRef };
}

function resolveActiveIndex(
  suggestions: AddressSuggestion[],
  activeProviderId: string | undefined,
): number {
  if (suggestions.length === 0) return -1;
  const activeProviderIndex = activeProviderId
    ? suggestions.findIndex(
        (suggestion) => suggestion.providerId === activeProviderId,
      )
    : -1;
  return activeProviderIndex >= 0 ? activeProviderIndex : 0;
}

function useAddressSuggestions(args: {
  activeProviderId: string | undefined;
  debouncedQuery: string;
  focused: boolean;
  listboxId: string;
  proximity: Coordinate | undefined;
  sessionToken: string;
  value: string;
}): SuggestionState {
  const {
    activeProviderId,
    debouncedQuery,
    focused,
    listboxId,
    proximity,
    sessionToken,
    value,
  } = args;
  const rawQueryReady = value.trim().length >= 2;
  const debouncedQueryReady = debouncedQuery.trim().length >= 2;
  const expanded = focused && rawQueryReady;
  const suggestQuery = trpc.plan.suggestAddresses.useQuery(
    { query: debouncedQuery, sessionToken, proximity },
    {
      enabled: expanded && debouncedQueryReady,
      staleTime: 60_000,
      placeholderData: (previousData) => previousData,
    },
  );
  const suggestions = expanded ? (suggestQuery.data ?? []) : [];
  const resolvedActiveIndex = resolveActiveIndex(suggestions, activeProviderId);
  const activeSuggestionId =
    resolvedActiveIndex >= 0
      ? `${listboxId}-${resolvedActiveIndex}`
      : undefined;
  const showLoadingRow =
    expanded &&
    suggestions.length === 0 &&
    (suggestQuery.isFetching || debouncedQuery.trim() !== value.trim());

  return {
    expanded,
    suggestions,
    resolvedActiveIndex,
    activeSuggestionId,
    showLoadingRow,
  };
}

function useFieldEventHandlers(args: {
  expanded: boolean;
  onChange: (value: string) => void;
  resolvedActiveIndex: number;
  retrieveAndSelect: (providerId: string) => void;
  setActiveProviderId: (providerId: string) => void;
  setFocused: (focused: boolean) => void;
  suggestions: AddressSuggestion[];
}): FieldEventHandlers {
  const {
    expanded,
    onChange,
    resolvedActiveIndex,
    retrieveAndSelect,
    setActiveProviderId,
    setFocused,
    suggestions,
  } = args;
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget;
    if (nextFocused && event.currentTarget.contains(nextFocused)) return;
    setFocused(false);
  };
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFocused(true);
    onChange(event.target.value);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && expanded) {
      setFocused(false);
      event.currentTarget.blur();
      return;
    }
    handleSuggestionKey(event, {
      resolvedActiveIndex,
      retrieveAndSelect,
      setActiveProviderId,
      setFocused,
      suggestions,
    });
  };

  return {
    onBlur,
    onChange: onInputChange,
    onFocus: () => setFocused(true),
    onKeyDown,
  };
}

function handleSuggestionKey(
  event: KeyboardEvent<HTMLInputElement>,
  args: {
    resolvedActiveIndex: number;
    retrieveAndSelect: (providerId: string) => void;
    setActiveProviderId: (providerId: string) => void;
    setFocused: (focused: boolean) => void;
    suggestions: AddressSuggestion[];
  },
) {
  const {
    resolvedActiveIndex,
    retrieveAndSelect,
    setActiveProviderId,
    setFocused,
    suggestions,
  } = args;
  if (suggestions.length === 0) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveProviderId(
      suggestions[(resolvedActiveIndex + 1) % suggestions.length].providerId,
    );
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActiveProviderId(
      suggestions[
        (resolvedActiveIndex - 1 + suggestions.length) % suggestions.length
      ].providerId,
    );
  }
  if (event.key === 'Enter' && resolvedActiveIndex >= 0) {
    event.preventDefault();
    void retrieveAndSelect(suggestions[resolvedActiveIndex].providerId);
    setFocused(false);
  }
}

function AddressInputRow(props: {
  activeSuggestionId: string | undefined;
  expanded: boolean;
  focused: boolean;
  handlers: FieldEventHandlers;
  kind: AddressFieldKind;
  listboxId: string;
  onUseCar: (() => void) | undefined;
  value: string;
}) {
  const {
    activeSuggestionId,
    expanded,
    focused,
    handlers,
    kind,
    listboxId,
    onUseCar,
    value,
  } = props;
  return (
    <Box className={planFormInputWrapClass} data-focused={focused}>
      <Input
        value={value}
        className={planFormTextInputClass}
        placeholder={
          kind === 'start'
            ? 'Address, place, or coordinates'
            : 'Where are you headed?'
        }
        onFocus={handlers.onFocus}
        onChange={handlers.onChange}
        onKeyDown={handlers.onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listboxId : undefined}
        aria-activedescendant={activeSuggestionId}
      />
      {onUseCar ? <UseCarButton onUseCar={onUseCar} /> : null}
    </Box>
  );
}

function UseCarButton({ onUseCar }: { onUseCar: () => void }) {
  return (
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
  );
}

function SuggestionsDropdown(props: {
  kind: AddressFieldKind;
  listboxId: string;
  onActivate: (providerId: string) => void;
  onHighlight: (providerId: string) => void;
  resolvedActiveIndex: number;
  showLoadingRow: boolean;
  suggestions: AddressSuggestion[];
}) {
  const {
    kind,
    listboxId,
    onActivate,
    onHighlight,
    resolvedActiveIndex,
    showLoadingRow,
    suggestions,
  } = props;
  const rowClasses = selectableRow({ variant: 'suggestion' });
  return (
    <Box
      id={listboxId}
      role="listbox"
      className={cx(panel({ variant: 'dropdown' }), dropdownPositionClass)}
    >
      {showLoadingRow ? <LoadingSuggestionRow rowClasses={rowClasses} /> : null}
      {suggestions.map((suggestion, index) => (
        <SuggestionOption
          key={suggestion.providerId}
          id={`${listboxId}-${index}`}
          kind={kind}
          rowClasses={rowClasses}
          selected={resolvedActiveIndex === index}
          suggestion={suggestion}
          onActivate={onActivate}
          onHighlight={onHighlight}
        />
      ))}
    </Box>
  );
}

function LoadingSuggestionRow({
  rowClasses,
}: {
  rowClasses: ReturnType<typeof selectableRow>;
}) {
  return (
    <Box className={rowClasses.row} role="status">
      <Box className={rowClasses.body}>Loading suggestions…</Box>
    </Box>
  );
}

function SuggestionOption(props: {
  id: string;
  kind: AddressFieldKind;
  onActivate: (providerId: string) => void;
  onHighlight: (providerId: string) => void;
  rowClasses: ReturnType<typeof selectableRow>;
  selected: boolean;
  suggestion: AddressSuggestion;
}) {
  const {
    id,
    kind,
    onActivate,
    onHighlight,
    rowClasses,
    selected,
    suggestion,
  } = props;
  return (
    <Button
      type="button"
      unstyled
      contentMode="custom"
      id={id}
      role="option"
      className={rowClasses.row}
      aria-selected={selected}
      onMouseDown={(event) => {
        event.preventDefault();
        onActivate(suggestion.providerId);
      }}
      onMouseEnter={() => onHighlight(suggestion.providerId)}
    >
      <Box className={rowClasses.icon}>
        <Icon icon={kind === 'start' ? MapPin : Flag} size="sm" />
      </Box>
      <Box className={rowClasses.body}>
        <Box className={rowClasses.primary}>{suggestion.primary}</Box>
        <Box className={rowClasses.secondary}>{suggestion.secondary}</Box>
      </Box>
    </Button>
  );
}

export function PlanAddressField({
  label,
  value,
  kind,
  proximity,
  action,
  onChange,
  onSelect,
  onUseCar,
  useCarLoading = false,
  useCarDisabled = false,
  useCarLabel = 'Use car location',
}: PlanAddressFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const [focused, setFocused] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<string>();
  const debouncedQuery = useDebouncedQuery(value);
  const { retrieveAndSelect, sessionTokenRef } = useRetrieveAddress(onSelect);
  const suggestionState = useAddressSuggestions({
    activeProviderId,
    debouncedQuery,
    focused,
    listboxId,
    proximity,
    sessionToken: sessionTokenRef.current,
    value,
  });
  const handlers = useFieldEventHandlers({
    expanded: suggestionState.expanded,
    onChange,
    resolvedActiveIndex: suggestionState.resolvedActiveIndex,
    retrieveAndSelect,
    setActiveProviderId,
    setFocused,
    suggestions: suggestionState.suggestions,
  });

  return (
    <Box className={planAddressFieldRootClass} onBlur={handlers.onBlur}>
      <FieldLabel action={action} kind={kind} label={label} />
      <AddressInputRow
        activeSuggestionId={suggestionState.activeSuggestionId}
        expanded={suggestionState.expanded}
        focused={focused}
        handlers={handlers}
        kind={kind}
        listboxId={listboxId}
        onUseCar={onUseCar}
        value={value}
      />
      {suggestionState.expanded ? (
        <SuggestionsDropdown
          kind={kind}
          listboxId={listboxId}
          onActivate={(providerId) => {
            void retrieveAndSelect(providerId);
            setFocused(false);
          }}
          onHighlight={setActiveProviderId}
          resolvedActiveIndex={suggestionState.resolvedActiveIndex}
          showLoadingRow={suggestionState.showLoadingRow}
          suggestions={suggestionState.suggestions}
        />
      ) : null}
    </Box>
  );
}
function FieldLabel({
  action,
  kind,
  label,
}: {
  action: React.ReactNode;
  kind: AddressFieldKind;
  label: string;
}) {
  const fieldHeaderClasses = sectionHeader({ marker: kind });
  return (
    <Box className={fieldHeaderClasses.label}>
      <Box className={fieldHeaderClasses.dot} />
      <span>{label}</span>
      {action}
    </Box>
  );
}
