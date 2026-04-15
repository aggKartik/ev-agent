import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { css } from '../../../styled-system/css';

type ModelStepProps = {
  value: string;
  error?: string;
  showError: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onBack: () => void;
  onNext: () => void;
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

export default function ModelStep(props: ModelStepProps) {
  const { value, error, showError, onChange, onBlur, onBack, onNext } = props;

  return (
    <div className={containerClass}>
      <Box>
        <Text as="h1" size="4xl" weight="bold" color="text.default" mb="sm">
          What&apos;s your car&apos;s model?
        </Text>
        <Text as="p" size="md" lineHeight="relaxed" color="text.subtle">
          Example: Model Y, Ioniq 5, Mustang Mach-E.
        </Text>
      </Box>

      <Box>
        <label htmlFor="model-input">
          <Text
            as="span"
            size="sm"
            weight="semibold"
            color="text.default"
            mb="sm"
          >
            Vehicle model
          </Text>
        </label>
        <input
          id="model-input"
          type="text"
          autoComplete="off"
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="Enter model"
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
          onClick={onNext}
          trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
        >
          Continue
        </Button>
      </Stack>
    </div>
  );
}
