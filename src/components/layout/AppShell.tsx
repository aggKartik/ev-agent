import type { ElementType, ReactNode } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import { css, cx } from '#/styled-system/css';

/**
 * Horizon/Stage layout primitive. Every top-level route shares this
 * contract:
 *
 * - `overlay`     fixed full-viewport container that pins the scene above
 *                 the page scroll.
 * - `app-container` + `.stars` / `.sun` / `.horizon` / `.horizon-grid`
 *                 are the global classes that paint the spatial background.
 * - `shell`       `100dvh` vertical flex column holding header + content.
 * - `stage`       scrollable, centered content region with responsive
 *                 gutters. The `onboarding` variant adds extra bottom
 *                 padding to clear the pinned form nav bar.
 * - `StageInner`  width-constrained wrapper (`max-width: 86rem`, gap-10)
 *                 for whatever lives inside the stage.
 *
 * Consumers compose this with `<AppShell header={...}><StageInner>…</StageInner></AppShell>`.
 */

const overlayClass = css({
  position: 'fixed',
  inset: 0,
  zIndex: '60',
});

const shellClass = css({
  position: 'relative',
  width: 'full',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 2,
});

const stageBaseClass = css({
  position: 'relative',
  zIndex: 5,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  justifyContent: 'center',
  px: { base: '5', md: '10' },
  pt: { base: '6', md: '6' },
  overflowY: 'auto',
});

const stageVariantClass = {
  default: css({
    alignItems: 'center',
    pb: { base: '16', md: '20' },
  }),
  onboarding: css({
    alignItems: { base: 'flex-start', md: 'center' },
    pb: { base: '40', md: '36' },
  }),
} as const;

const stageTopAlignClass = css({
  alignItems: 'flex-start',
});

const planStageClass = css({
  position: 'relative',
  zIndex: 5,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  px: '2.5',
  py: '2.5',
  overflow: 'hidden',
  '& > *': {
    width: 'full',
    height: 'calc(100dvh - 96px)',
    maxHeight: 'calc(100dvh - 96px)',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  '& > * > *': {
    height: 'full',
    minHeight: 0,
  },
});

const stageInnerClass = css({
  width: 'full',
  maxWidth: '86rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  alignItems: 'center',
  px: { base: '6', md: '10' },
});

type Background = 'full' | 'horizon-only';
type StageVariant = keyof typeof stageVariantClass;

type AppShellProps = {
  header: ReactNode;
  children: ReactNode;
  /** Rendered between the header and the stage (e.g. progress strip). */
  progress?: ReactNode;
  /** Rendered outside the scrolling shell (e.g. fixed-position nav bar). */
  footer?: ReactNode;
  /** Background elements to paint behind the shell. Defaults to `full`. */
  background?: Background;
  /** Stage padding/alignment variant. Defaults to `default`. */
  stage?: StageVariant;
  /** Top-align stage content (e.g. for long scroll steps). */
  stageTopAlign?: boolean;
};

export default function AppShell({
  header,
  children,
  progress,
  footer,
  background = 'full',
  stage = 'default',
  stageTopAlign = false,
}: AppShellProps) {
  const usesPlanStage =
    stage === 'default' && background === 'horizon-only' && stageTopAlign;

  return (
    <Box className={overlayClass}>
      <Box className="app-container">
        {background === 'full' ? (
          <>
            <Box className="stars" />
            <Box className="sun" />
          </>
        ) : null}
        <Box className="horizon">
          <Box className="horizon-grid" />
        </Box>

        <Stack className={shellClass}>
          {header}
          {progress}
          <Box
            className={
              usesPlanStage
                ? planStageClass
                : cx(
                    stageBaseClass,
                    stageVariantClass[stage],
                    stageTopAlign ? stageTopAlignClass : undefined,
                  )
            }
          >
            {children}
          </Box>
          {footer}
        </Stack>
      </Box>
    </Box>
  );
}

type StageInnerProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

/**
 * Width-constrained wrapper for stage content. Default element is a `div`;
 * pass `as="form"` (or any element/component) plus its props for callers
 * that need the wrapper to be a form / nav / etc.
 */
export function StageInner({
  as,
  className,
  children,
  ...rest
}: StageInnerProps) {
  return (
    <Box as={as} className={cx(stageInnerClass, className)} {...rest}>
      {children}
    </Box>
  );
}
