import { ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import { Text } from '#/components/ui/Text';
import { OnboardingStepHeader } from '#/features/onboarding/components/StepHeader';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';

type SuccessStepProps = {
  carSummary?: string;
  onNext: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export default function SuccessStep({
  carSummary,
  onNext,
  isSubmitting,
  errorMessage,
}: SuccessStepProps) {
  const stepClasses = step();
  const actionsClass = css({
    marginTop: '5.5',
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    flexWrap: 'wrap',
  });

  const carLabel = (carSummary ?? '').trim() || undefined;

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <OnboardingStepHeader
          kicker="ROUTE READY"
          title={
            <>
              All set. Let's hit the{' '}
              <Box as="em">
                road
                <Box as="span" className={stepClasses.titlePunct}>
                  .
                </Box>
              </Box>
            </>
          }
          description={
            <>
              We've synced your Tesla vehicle data with our range profiles and
              trip tools. Saving your dashboard…
            </>
          }
        />

        {errorMessage ? (
          <Text marginTop="3" color="magenta.300" role="alert">
            {errorMessage}
          </Text>
        ) : null}

        <Stack direction="row" className={actionsClass}>
          <Button
            onClick={onNext}
            loading={isSubmitting}
            loadingText="Saving"
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Launch dashboard
          </Button>
        </Stack>
      </Stack>
      <VisualPanel
        kind="success"
        data={carLabel ? { car: carLabel } : undefined}
      />
    </Box>
  );
}
