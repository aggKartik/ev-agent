import { useEffect } from 'react';

/**
 * Wires global left/right arrow keys to step navigation. Ignores events
 * originating inside text inputs so typing isn't hijacked.
 */
export function useKeyboardStepNavigation(args: {
  enabled: boolean;
  canAdvance: boolean;
  onPrev: () => void;
  onNext: () => void;
}): void {
  const { enabled, canAdvance, onPrev, onNext } = args;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (event.key === 'ArrowLeft') {
        onPrev();
      } else if (event.key === 'ArrowRight' && canAdvance) {
        onNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, canAdvance, onPrev, onNext]);
}
