export const DEFAULT_TIMEOUT_MS = 25_000;

export type ToolGroup = 'narrate' | 'ocm' | 'mapbox' | 'tomtom';

export type ParsedArgs = {
  groups: ReadonlySet<ToolGroup>;
  timeoutMs: number;
  verboseTomTom: boolean;
};

const HELP_MESSAGE = `smoke-plan-tools — exercise plan-agent tool execute() handlers

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
`;

const TOOL_GROUP_ALIASES: Record<string, ToolGroup> = {
  narrate: 'narrate',
  ocm: 'ocm',
  mapbox: 'mapbox',
  tomtom: 'tomtom',
  prefetch: 'tomtom',
};

const ALL_GROUPS: readonly ToolGroup[] = ['narrate', 'ocm', 'mapbox', 'tomtom'];

const VERBOSE_ENV_TRUTHY = new Set(['1', 'true', 'yes']);

function failWith(msg: string): never {
  console.error(msg);
  process.exit(2);
}

function showHelpAndExit(): never {
  console.log(HELP_MESSAGE);
  process.exit(0);
}

function parseToolsFlag(value: string, into: Set<ToolGroup>): void {
  for (const segment of value.split(',')) {
    const key = segment.trim().toLowerCase();
    if (key.length === 0) continue;
    const group = TOOL_GROUP_ALIASES[key];
    if (!group) {
      failWith(
        `Unknown --tools segment: "${segment}". Use narrate | ocm | mapbox | tomtom`,
      );
    }
    into.add(group);
  }
}

function parseTimeoutFlag(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    failWith('--timeout must be a positive number (ms)');
  }
  return n;
}

function envVerboseTomTom(): boolean {
  const raw = process.env.SMOKE_VERBOSE_TOMTOM?.trim().toLowerCase() ?? '';
  return VERBOSE_ENV_TRUTHY.has(raw);
}

type Mut = {
  timeoutMs: number;
  verboseTomTomFlag: boolean;
  groups: Set<ToolGroup>;
};

type ArgHandler = {
  match: (arg: string) => boolean;
  apply: (arg: string, mut: Mut) => void;
};

const ARG_HANDLERS: readonly ArgHandler[] = [
  {
    match: (arg) => arg === '--help' || arg === '-h',
    apply: () => showHelpAndExit(),
  },
  {
    match: (arg) => arg === '--verbose' || arg === '-v',
    apply: (_arg, mut) => {
      mut.verboseTomTomFlag = true;
    },
  },
  {
    match: (arg) => arg.startsWith('--tools='),
    apply: (arg, mut) =>
      parseToolsFlag(arg.slice('--tools='.length), mut.groups),
  },
  {
    match: (arg) => arg.startsWith('--timeout='),
    apply: (arg, mut) => {
      mut.timeoutMs = parseTimeoutFlag(arg.slice('--timeout='.length));
    },
  },
];

function dispatchArg(arg: string, mut: Mut): void {
  const handler = ARG_HANDLERS.find((h) => h.match(arg));
  if (!handler) failWith(`Unexpected argument: ${arg}`);
  handler.apply(arg, mut);
}

export function parseArgs(argv: string[]): ParsedArgs {
  const mut: Mut = {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    verboseTomTomFlag: false,
    groups: new Set<ToolGroup>(),
  };

  for (let i = 2; i < argv.length; i++) dispatchArg(argv[i], mut);

  if (mut.groups.size === 0) {
    for (const g of ALL_GROUPS) mut.groups.add(g);
  }

  return {
    groups: mut.groups,
    timeoutMs: mut.timeoutMs,
    verboseTomTom: mut.verboseTomTomFlag || envVerboseTomTom(),
  };
}
