import { createFileRoute, useNavigate } from '@tanstack/react-router';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import WelcomeStep from '#/features/onboarding/components/WelcomeStep';
import { emptyOnboardingSearch } from '#/features/onboarding/search';

export const Route = createFileRoute('/')({ component: WelcomeRoute });

function WelcomeRoute() {
  const navigate = useNavigate();

  const handleContinue = () => {
    void navigate({ to: '/onboarding', search: emptyOnboardingSearch });
  };

  return (
    <AppShell
      header={
        <Header
          sessionLabel="SESSION · 00/08"
          buildLabel="v1.0 BETA"
          showMeta
        />
      }
    >
      <StageInner>
        <WelcomeStep onContinue={handleContinue} />
      </StageInner>
    </AppShell>
  );
}
