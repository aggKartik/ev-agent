import type { ReactNode } from 'react';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <AppShell header={<Header showMeta={false} />}>
      <StageInner>{children}</StageInner>
    </AppShell>
  );
}
