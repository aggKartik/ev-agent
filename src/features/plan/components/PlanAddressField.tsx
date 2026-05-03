import { Crosshair, Flag, MapPin } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useMemo, useState } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import Input from '#/components/ui/Input';
import type { PlanAddress } from '#/shared/plan/contracts';
import { suggestPlanAddresses } from '#/shared/plan/helpers';
import { css, cx } from '#/styled-system/css';
import { panel } from '#/styled-system/recipes/panel';
import { sectionHeader } from '#/styled-system/recipes/section-header';
import { selectableRow } from '#/styled-system/recipes/selectable-row';

/** Shared underline input row (start/end fields + vehicle row). */
export const planFormInputWrapClass = css({
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
export const planFormTextInputClass = css({
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

export type PlanAddressFieldProps = {
  label: string;
  value: string;
  kind: 'start' | 'end';
  action?: React.ReactNode;
  onChange: (value: string) => void;
  onSelect: (address: PlanAddress) => void;
  onUseCar?: () => void;
};

export function PlanAddressField({
  label,
  value,
  kind,
  action,
  onChange,
  onSelect,
  onUseCar,
}: PlanAddressFieldProps) {
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
