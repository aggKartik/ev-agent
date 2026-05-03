import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { onboarding } from '#/styled-system/recipes';

type Props = {
  canAdvance: boolean;
  primaryLabel: string;
  onPrev: () => void;
  onNext: () => void;
};

export default function OnboardingPinnedNav({
  canAdvance,
  primaryLabel,
  onPrev,
  onNext,
}: Props) {
  const o = onboarding();
  return (
    <Box className={o.dock}>
      <Box className={o.dockInner}>
        <Box className={o.dockPrimary}>
          <Button variant="ghost" onClick={onPrev}>
            Back
          </Button>
          <Button disabled={!canAdvance} onClick={onNext}>
            {primaryLabel}
          </Button>
        </Box>
        <Box className={o.dockEdges}>
          <Button
            variant="ghost"
            size="sm"
            className={o.dockEdgeButton}
            aria-label="Back step"
            onClick={onPrev}
          >
            {'←'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={o.dockEdgeButton}
            aria-label="Next step"
            disabled={!canAdvance}
            onClick={onNext}
          >
            {'→'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
