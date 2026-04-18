import { ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { step } from '../../../styled-system/recipes/step';

type IntroCarStepProps = {
  onNext: () => void;
};

export default function IntroCarStep({ onNext }: IntroCarStepProps) {
  const stepClasses = step({ single: true });
  return (
    <div className={stepClasses.card}>
      <div style={{ textAlign: 'center', maxWidth: 780 }}>
        <div
          className={stepClasses.kicker}
          style={{ justifyContent: 'center' }}
        >
          CHAPTER 01 · THE GARAGE
        </div>
        <h1 className={stepClasses.title}>
          First, tell us <em>about your car</em>.
        </h1>
        <p className={stepClasses.desc}>
          Different EVs have different ranges, charging curves and plug types.
          We'll match stops to yours — down to the stall.
        </p>
        <div className={stepClasses.actions}>
          <Button
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Pop the hood
          </Button>
        </div>
      </div>
    </div>
  );
}
