import { ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { step } from '../../../styled-system/recipes/step';
import { welcome } from '../../../styled-system/recipes/welcome';

type WelcomeStepProps = {
  onContinue: () => void;
};

const WelcomeStep = ({ onContinue }: WelcomeStepProps) => {
  const stepClasses = step({ single: true });
  const welcomeClasses = welcome();
  return (
    <div className={stepClasses.card}>
      <div style={{ textAlign: 'center' }}>
        <div className={welcomeClasses.eyebrow}>EV · AGENT · v1</div>
        <h1 className={welcomeClasses.title}>
          Roadtrips
          <br />
          that <span className="it">charge</span>
          <br />
          themselves.
        </h1>
        <p className={welcomeClasses.sub}>
          Tell us where you're going and what you love. We'll plan stops around
          coffee, trails and tacos — not random plugs in parking lots.
        </p>
        <div className={stepClasses.actions}>
          <Button
            onClick={onContinue}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Start the tour
          </Button>
          <Button variant="ghost">I have an account</Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
