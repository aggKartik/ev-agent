import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { option } from '../../../styled-system/recipes/option';

type MakeStepProps = {
  value: string;
  nameState?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const MAKES = [
  { name: 'Tesla', sub: 'Supercharger native' },
  { name: 'Rivian', sub: 'Adventure network' },
  { name: 'Ford', sub: 'BlueCruise ready' },
  { name: 'Hyundai', sub: '800V fast charge' },
  { name: 'Kia', sub: 'E-GMP platform' },
  { name: 'Polestar', sub: 'Scandi minimal' },
  { name: 'Lucid', sub: 'Air / Gravity' },
  { name: 'Chevrolet', sub: 'Ultium platform' },
  { name: 'BMW', sub: 'i-series' },
];

export default function MakeStep({
  value,
  nameState,
  onChange,
  onNext,
  onBack,
}: MakeStepProps) {
  const stepClasses = step();
  const optionClasses = option();

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>02 · THE MAKE</div>
        <h1 className={stepClasses.title}>
          {nameState ? nameState + ', ' : ''}what do you <em>drive</em>?
        </h1>
        <p className={stepClasses.desc}>
          We preload the right charging connector and fast-charge curve so
          routing is accurate from the first mile.
        </p>

        <div className={stepClasses.field}>
          <div className={optionClasses.grid}>
            {MAKES.map((m) => {
              const sel = value === m.name;
              const cardClasses = option({ selected: sel });
              return (
                <button
                  type="button"
                  key={m.name}
                  className={cardClasses.card}
                  onClick={() => onChange(m.name)}
                >
                  <div>{m.name}</div>
                  <div className={cardClasses.sub}>{m.sub}</div>
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
      <VisualPanel kind="make" data={{ make: value }} />
    </div>
  );
}
