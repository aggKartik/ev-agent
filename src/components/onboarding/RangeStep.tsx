import { ArrowLeft, Check } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { css } from '../../../styled-system/css';

type RangeStepProps = {
  value: string;
  error?: string;
  showError: boolean;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onBack: () => void;
  onSubmit: () => void;
};

const containerClass = css({
  width: 'full',
  display: 'flex',
  flexDirection: 'column',
  gap: 'xl',
});

const inputClass = css({
  width: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border.input',
  borderRadius: 'md',
  bg: 'bg.card',
  color: 'text.default',
  px: 'md',
  py: 'sm',
  fontSize: 'md',
  _placeholder: {
    color: 'text.subtle',
  },
  _focusVisible: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: 'ring.default',
    outlineOffset: '2px',
  },
});

const errorClass = css({
  color: 'error.solid',
  fontSize: 'sm',
  mt: 'xs',
});

export default function RangeStep(props: RangeStepProps) {
  const {
    value,
    error,
    showError,
    isSubmitting,
    onChange,
    onBlur,
    onBack,
    onSubmit,
  } = props;

  return (
    <div className={containerClass}>
      <Box>
        <Text as="h1" size="4xl" weight="bold" color="text.default" mb="sm">
          What&apos;s your estimated range?
        </Text>
        <Text as="p" size="md" lineHeight="relaxed" color="text.subtle">
          Enter your expected full-charge range in miles.
        </Text>
      </Box>

      <Box>
        <label htmlFor="range-input">
          <Text
            as="span"
            size="sm"
            weight="semibold"
            color="text.default"
            mb="sm"
          >
            Full-charge range (mi)
          </Text>
        </label>
        <input
          id="range-input"
          type="number"
          inputMode="decimal"
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="300"
        />
        {showError && error ? <p className={errorClass}>{error}</p> : null}
      </Box>

      <Stack direction="row" gap="sm" justify="space-between">
        <Button
          variant="ghost"
          onClick={onBack}
          leadingIcon={<Icon icon={ArrowLeft} size="sm" tone="default" />}
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          loading={isSubmitting}
          loadingText="Saving..."
          trailingIcon={<Icon icon={Check} size="sm" tone="default" />}
        >
          Finish
        </Button>
      </Stack>
    </div>
  );
}
