#!/usr/bin/env bun
/**
 * Lint gate that runs `fallow health` and fails if any function exceeds the
 * project's complexity thresholds. Wraps the json output because `fallow
 * health` itself does not exit non-zero on findings.
 *
 * Thresholds intentionally focus on **cognitive complexity** (the metric the
 * team chose to track) and a generous cyclomatic ceiling. CRAP isn't gated
 * here because it requires runtime coverage to be accurate.
 */

const MAX_COGNITIVE = 10;
const MAX_CYCLOMATIC = 25;

type Finding = {
  path: string;
  name: string;
  line: number;
  cyclomatic: number;
  cognitive: number;
};

const proc = Bun.spawn(
  ['bunx', 'fallow', 'health', '--format', 'json', '--quiet'],
  { stdout: 'pipe', stderr: 'pipe' },
);

const [stdout, stderr] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
]);
await proc.exited;

let parsed: { findings?: Finding[] };
try {
  parsed = JSON.parse(stdout) as { findings?: Finding[] };
} catch (err) {
  console.error('fallow output was not JSON:');
  console.error(stdout.slice(0, 500));
  if (stderr) console.error(stderr.slice(0, 500));
  throw err;
}

const offenders = (parsed.findings ?? []).filter(
  (f) => f.cognitive >= MAX_COGNITIVE || f.cyclomatic >= MAX_CYCLOMATIC,
);

if (offenders.length === 0) {
  console.log(
    `fallow complexity gate: clean (cognitive < ${MAX_COGNITIVE}, cyclomatic < ${MAX_CYCLOMATIC})`,
  );
  process.exit(0);
}

console.error(
  `fallow complexity gate: ${offenders.length} function(s) over threshold (cognitive ≥ ${MAX_COGNITIVE} or cyclomatic ≥ ${MAX_CYCLOMATIC})`,
);
for (const f of offenders) {
  console.error(
    `  ${f.path}:${f.line} ${f.name} — cyclomatic=${f.cyclomatic} cognitive=${f.cognitive}`,
  );
}
process.exit(1);
