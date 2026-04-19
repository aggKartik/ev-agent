import type { ReactNode } from 'react';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';

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
