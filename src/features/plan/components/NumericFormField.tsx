import { Box } from 'styled-system/jsx';
import Input from '#/components/ui/Input';
import { css } from '#/styled-system/css';
import {
  planFormInputWrapClass,
  planFormTextInputClass,
} from './PlanAddressField';

type NumericField = {
  state: { value: number };
  handleChange: (value: number) => void;
};

export type NumericFormFieldProps = {
  field: NumericField;
  label: string;
  min: number;
  max: number;
  step?: number;
  inputMode?: 'numeric' | 'decimal';
};

const wrapClass = css({
  width: '120px',
  flexShrink: 0,
});

const sublabelClass = css({
  fontSize: '2xs',
  color: 'cream.600',
  mb: '1',
  textStyle: 'mono-meta',
  letterSpacing: '0.12em',
});

/**
 * Compact numeric form field used for SOC %, kWh, Wh/mi, and similar plan
 * inputs. Wraps a TanStack Form field render-prop value so callers stay
 * declarative inside `<form.Field>{(field) => …}</form.Field>`.
 */
export default function NumericFormField({
  field,
  label,
  min,
  max,
  step = 1,
  inputMode = 'numeric',
}: NumericFormFieldProps) {
  return (
    <Box className={wrapClass}>
      <Box className={sublabelClass}>{label}</Box>
      <Box className={planFormInputWrapClass} data-focused={false}>
        <Input
          type="number"
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          value={field.state.value}
          className={planFormTextInputClass}
          onChange={(event) => {
            const n = event.target.valueAsNumber;
            if (Number.isFinite(n)) field.handleChange(n);
          }}
        />
      </Box>
    </Box>
  );
}
