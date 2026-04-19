import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import WelcomeStep from '#/components/onboarding/WelcomeStep';

export const Route = createFileRoute('/')({ component: WelcomeRoute });

function WelcomeRoute() {
  const navigate = useNavigate();

  const handleContinue = () => {
    void navigate({ to: '/onboarding' });
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
