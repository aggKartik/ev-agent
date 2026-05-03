import type { FormEvent, ReactNode } from 'react';
import { Box } from 'styled-system/jsx';
import { StageInner } from '#/components/layout/AppShell';
import { onboarding } from '#/styled-system/recipes';

type Props = {
  transitionKey: number;
  direction: 'forward' | 'back';
  children: ReactNode;
};

export default function OnboardingStepStage({
  transitionKey,
  direction,
  children,
}: Props) {
  const o = onboarding();
  return (
    <Box key={transitionKey} data-direction={direction} className={o.stage}>
      <StageInner
        as="form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
        }}
      >
        {children}
      </StageInner>
    </Box>
  );
}
