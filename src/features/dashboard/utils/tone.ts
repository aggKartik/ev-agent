import type { CSSProperties } from 'react';
import type { DashboardTone } from '#/features/dashboard/types/contracts';

export const DASHBOARD_TONE_HEX: Record<DashboardTone, string> = {
  peach: '#ff9566',
  lime: '#d6ff3d',
  magenta: '#e94a8c',
  violet: '#7b4bd1',
  muted: '#f5ead061',
};

export function toneStyle(tone: DashboardTone): CSSProperties {
  return { '--tone': DASHBOARD_TONE_HEX[tone] } as CSSProperties;
}
