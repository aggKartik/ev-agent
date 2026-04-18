import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { input } from '../../../styled-system/recipes/input';

type NameStepProps = {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function NameStep({
  value,
  onChange,
  onNext,
  onBack,
}: NameStepProps) {
  const stepClasses = step();
  const canAdvance = (value || '').trim().length > 0;

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>01 · WHO'S DRIVING</div>
        <h1 className={stepClasses.title}>
          What should we <em>call you</em>?
        </h1>
        <p className={stepClasses.desc}>
          Just your first name is fine — we'll use it on your trip plans and
          when we text route changes.
        </p>
        <div className={stepClasses.field}>
          <input
            className={input()}
            type="text"
            autoFocus
            placeholder="Type your name…"
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
      <VisualPanel kind="name" />
    </div>
  );
}
