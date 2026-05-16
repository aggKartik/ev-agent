import { tool } from 'ai';
import { z } from 'zod';
import type { PlanStreamEvent } from '#/shared/plan/contracts';

type Deps = {
  emit: (event: PlanStreamEvent) => void;
};

function clampProgressPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

export function makeNarrateProgressTool({ emit }: Deps) {
  let highestProgressPercent = 0;

  return tool({
    description:
      'Push a status update for the user-facing planning UI. Use `phase` + `detail` when starting a new high-level planning phase, or `message` for a single line of narration about what you are doing right now. Call this between phases to keep the user informed.',
    inputSchema: z.object({
      phase: z
        .string()
        .min(1)
        .optional()
        .describe(
          'Short title for a new planning phase (e.g. "Scanning route options").',
        ),
      detail: z
        .string()
        .min(1)
        .optional()
        .describe('One-sentence detail to show under the phase title.'),
      message: z
        .string()
        .min(1)
        .optional()
        .describe('A standalone narration line shown in the live log.'),
      progressPercent: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe(
          'Optional completion percentage for this update. It is clamped server-side and must not move backward.',
        ),
    }),
    execute: async ({ phase, detail, message, progressPercent }) => {
      if (progressPercent !== undefined) {
        highestProgressPercent = Math.max(
          highestProgressPercent,
          clampProgressPercent(progressPercent),
        );
        emit({
          type: 'progress',
          percent: highestProgressPercent,
          label: phase,
          detail,
        });
      }

      if (phase) {
        emit({
          type: 'phase',
          label: phase,
          detail: detail ?? '',
        });
      } else if (message) {
        emit({ type: 'narration', message });
      } else if (detail) {
        emit({ type: 'narration', message: detail });
      }
      return { ok: true as const };
    },
  });
}
