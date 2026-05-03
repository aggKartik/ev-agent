import { tool } from 'ai';
import { z } from 'zod';
import type { PlanStreamEvent } from '#/shared/plan/contracts';

type Deps = {
  emit: (event: PlanStreamEvent) => void;
};

export function makeNarrateProgressTool({ emit }: Deps) {
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
    }),
    execute: async ({ phase, detail, message }) => {
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
