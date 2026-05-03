export const DEFAULT_TIMEOUT_MS = 25_000;

export type ToolGroup = 'narrate' | 'ocm' | 'mapbox' | 'tomtom';

export function parseArgs(argv: string[]): {
  groups: ReadonlySet<ToolGroup>;
  timeoutMs: number;
  verboseTomTom: boolean;
} {
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let verboseTomTomFlag = false;
  const groups = new Set<ToolGroup>();

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`smoke-plan-tools — exercise plan-agent tool execute() handlers

Usage:
  bun run smoke:tools
  bun run scripts/smoke/plan-tools/main.ts [options]

Options:
  --tools=a,b,c   Comma list: narrate | ocm | mapbox | tomtom (default: all four)
                  mapbox covers searchPlaces + getDirections;
                  tomtom runs computeEvRoute (server prefetch → TomTom LDEV or straight-line fallback)
  --timeout=ms    Per-request abort for networked tools (${DEFAULT_TIMEOUT_MS})
  --verbose,-v    With --tools=tomtom: print LDEV diagnostics (requires a second billed
                  TomTom HTTP call when TOMTOM_API_KEY is set; first line is probe, then computeEvRoute).
                  Equivalent: env SMOKE_VERBOSE_TOMTOM=1
  -h, --help      This message

Mapbox tools skip with hint when MAPBOX_TOKEN is unset.
TomTom prefetch still runs without TOMTOM_API_KEY (expect straight_line_fallback + empty anchors).
`);
      process.exit(0);
    }
    if (arg.startsWith('--tools=')) {
      const list = arg.slice('--tools='.length).split(',');
      for (const key of list) {
        const k = key.trim().toLowerCase();
        if (k === 'narrate') groups.add('narrate');
        else if (k === 'ocm') groups.add('ocm');
        else if (k === 'mapbox') groups.add('mapbox');
        else if (k === 'tomtom' || k === 'prefetch') groups.add('tomtom');
        else if (k.length > 0) {
          console.error(
            `Unknown --tools segment: "${key}". Use narrate | ocm | mapbox | tomtom`,
          );
          process.exit(2);
        }
      }
      continue;
    }
    if (arg.startsWith('--timeout=')) {
      const n = Number(arg.slice('--timeout='.length));
      if (!Number.isFinite(n) || n <= 0) {
        console.error('--timeout must be a positive number (ms)');
        process.exit(2);
      }
      timeoutMs = n;
      continue;
    }
    if (arg === '--verbose' || arg === '-v') {
      verboseTomTomFlag = true;
      continue;
    }
    console.error(`Unexpected argument: ${arg}`);
    process.exit(2);
  }

  if (groups.size === 0) {
    groups.add('narrate');
    groups.add('ocm');
    groups.add('mapbox');
    groups.add('tomtom');
  }

  const verboseTomTom =
    verboseTomTomFlag ||
    ['1', 'true', 'yes'].includes(
      process.env.SMOKE_VERBOSE_TOMTOM?.trim().toLowerCase() ?? '',
    );

  return { groups, timeoutMs, verboseTomTom };
}
