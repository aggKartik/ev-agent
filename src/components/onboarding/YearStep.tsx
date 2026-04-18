import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { input } from '../../../styled-system/recipes/input';

type YearStepProps = {
  value: string;
  makeState?: string;
  modelState?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function YearStep({
  value,
  makeState,
  modelState,
  onChange,
  onNext,
  onBack,
}: YearStepProps) {
  const stepClasses = step();
  const canAdvance = value.length === 4;

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>04 · THE YEAR</div>
        <h1 className={stepClasses.title}>
          Lastly, the <em>model year</em>.
        </h1>
        <p className={stepClasses.desc}>
          Manufacturers tweak battery packs between years. We'll use this to
          pull the exact EPA range.
        </p>

        <div className={stepClasses.field}>
          <input
            className={input()}
            type="number"
            placeholder="YYYY"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdvance) onNext();
            }}
          />
        </div>

        <div className={stepClasses.actions}>
          <Button
            variant="ghost"
            onClick={onBack}
            leadingIcon={<Icon icon={ArrowLeft} size="sm" tone="default" />}
          >
            Back
          </Button>
          <Button
            disabled={!canAdvance}
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Continue
          </Button>
        </div>
      </div>
      <VisualPanel
        kind="year"
        data={{ make: makeState, model: modelState, year: value }}
      />
    </div>
  );
}
