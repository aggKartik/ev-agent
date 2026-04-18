import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { option } from '../../../styled-system/recipes/option';

type PrefsStepProps = {
  value: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const PREF_OPTIONS = [
  { label: 'Coffee roasters', e: '☕' },
  { label: 'Tacos', e: '🌮' },
  { label: 'Hiking / trails', e: '🥾' },
  { label: 'Scenic overlooks', e: '🏔' },
  { label: 'Roadside diners', e: '🍳' },
  { label: 'Thrift / antique', e: '📻' },
];

export default function PrefsStep({
  value,
  onChange,
  onNext,
  onBack,
}: PrefsStepProps) {
  const stepClasses = step();
  const optionClasses = option({ twoCols: true });

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className={stepClasses.card}>
      <div>
        <div className={stepClasses.kicker}>06 · THE VIBE</div>
        <h1 className={stepClasses.title}>
          What are your <em>ideal stops</em>?
        </h1>
        <p className={stepClasses.desc}>
          We'll factor these into your routing logic. Instead of a Walmart
          parking lot, maybe charge near an indie roaster.
        </p>

        <div className={stepClasses.field}>
          <div className={optionClasses.grid}>
            {PREF_OPTIONS.map((o) => {
              const sel = value.includes(o.label);
              const cardClasses = option({ selected: sel });
              return (
                <button
                  type="button"
                  key={o.label}
                  className={cardClasses.card}
                  onClick={() => toggleOption(o.label)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                  }}
                >
                  <div className={cardClasses.blob}>{o.e}</div>
                  <div>{o.label}</div>
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
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Review Route
          </Button>
        </div>
      </div>
      <VisualPanel kind="prefs" data={{ prefs: value }} />
    </div>
  );
}
