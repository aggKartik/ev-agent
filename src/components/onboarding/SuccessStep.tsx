import { ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';

type SuccessStepProps = {
  makeState?: string;
  modelState?: string;
  onNext: () => void;
};

export default function SuccessStep({
  makeState,
  modelState,
  onNext,
}: SuccessStepProps) {
  const stepClasses = step();

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>ROUTE READY</div>
        <h1 className={stepClasses.title}>
          All set. Let's hit the <em>road</em>.
        </h1>
        <p className={stepClasses.desc}>
          We've compiled your vehicle data, range profile, and stop preferences.
          Generating your first smart itinerary...
        </p>

        <div className={stepClasses.actions}>
          <Button
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Launch dashboard
          </Button>
        </div>
      </div>
      <VisualPanel
        kind="success"
        data={{ car: `${makeState} ${modelState}` }}
      />
    </div>
  );
}
