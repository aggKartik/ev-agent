import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { option } from '../../../styled-system/recipes/option';

type ModelStepProps = {
  value: string;
  makeState?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const MODELS: Record<string, string[]> = {
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Rivian: ['R1T', 'R1S', 'R2', 'R3'],
  Ford: ['Mustang Mach-E', 'F-150 Lightning', 'E-Transit'],
  Hyundai: ['Ioniq 5', 'Ioniq 6', 'Kona EV'],
  Kia: ['EV6', 'EV9', 'Niro EV'],
  Polestar: ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  Lucid: ['Air Pure', 'Air Touring', 'Air Grand Touring', 'Gravity'],
  Chevrolet: ['Bolt EUV', 'Blazer EV', 'Equinox EV', 'Silverado EV'],
  BMW: ['i4', 'iX', 'i5', 'i7'],
};

export default function ModelStep({
  value,
  makeState,
  onChange,
  onNext,
  onBack,
}: ModelStepProps) {
  const stepClasses = step();
  const optionClasses = option();

  const options = (makeState && MODELS[makeState]) || [
    'Model 3',
    'Ioniq 5',
    'Mach-E',
    'Other',
  ];

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>03 · THE MODEL</div>
        <h1 className={stepClasses.title}>
          Which <em>{makeState || 'model'}</em> is it?
        </h1>
        <p className={stepClasses.desc}>
          Battery sizes and efficiencies vary by model. We need this to gauge
          how far you can go on a full charge.
        </p>

        <div className={stepClasses.field}>
          <div className={optionClasses.grid}>
            {options.map((m) => {
              const sel = value === m;
              const cardClasses = option({ selected: sel });
              return (
                <button
                  type="button"
                  key={m}
                  className={cardClasses.card}
                  onClick={() => onChange(m)}
                >
                  <div style={{ margin: 'auto' }}>{m}</div>
                </button>
              );
            })}
          </div>
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
            disabled={!value}
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Continue
          </Button>
        </div>
      </div>
      <VisualPanel kind="model" data={{ make: makeState, model: value }} />
    </div>
  );
}
