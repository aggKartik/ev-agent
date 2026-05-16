# AGENTS.md

## Quick Start Commands
- Use Bun for everything (`bun install`, not npm/pnpm/yarn).
- Dev server: `bun dev` (Vite on port `3000`).
- Quality checks: `bun run check` runs Biome + Vitest (with Istanbul coverage) + `fallow audit` against the saved baselines in `.fallow-baselines/`.
- Tests: `bun test` (runs Vitest; missing tests now surface as failures since `--passWithNoTests` was removed).
- Manual smoke (plan tools + EV prefetch, no LLM): `bun run smoke:tools` (entry `scripts/smoke/plan-tools/main.ts`; use `--help` for flags).
- Production build: `bun run build` (runs `prepare` first, then Vite build).

### Fallow baselines

- `fallow audit` runs in `--gate new-only` mode and only fails on findings introduced by the current PR. The current state of the repo (dead code, complexity, duplication) is captured as baselines in `.fallow-baselines/` so existing inherited findings are excluded from the verdict.
- After intentional cleanup (deleting dead code, refactoring complex functions, deduplicating clones), refresh the baselines with `bun run lint:complexity:save-baselines` and commit the regenerated `.fallow-baselines/*.json` files. Never commit a baseline that is *worse* than the current state without justification — the baseline is the bar, not a mask.

## Generated Files (Do Not Hand Edit)
- `src/routeTree.gen.ts` is TanStack Router generated output; treat as read-only.
- `styled-system/` is Panda CSS generated output (gitignored); regenerate via `bun run prepare` after token/recipe/config changes.

## App Wiring That Is Easy To Miss
- File routes live in `src/routes/**`; current user-facing routes are `/` and `/onboarding/`.
- tRPC HTTP handler is wired through `src/routes/api.trpc.$trpc.ts` at `/api/trpc`.
- OAuth connect/callback handlers live at `src/routes/api.oauth.$provider.connect.ts` and `src/routes/api.oauth.$provider.callback.ts` (URLs `/api/oauth/:provider/connect` and `/api/oauth/:provider/callback`).
- Client tRPC setup is in `src/lib/trpc.ts`; server router composition is in `src/server/platform/trpc/router.ts`.
- Root providers (QueryClient, tRPC provider, devtools, global CSS) are in `src/routes/__root.tsx`.

## Database / Local Infra
- Local Postgres is managed with `docker-compose.dev.yml` via `bun run db:start` / `bun run db:stop`.
- Required env var for DB work: `DATABASE_URL` (see `.env.example`).
- Run migrations with `bun run db:migrate`; full rollback helper: `bun run db:migrate:reset`.
- Kysely DB singleton is created in `src/server/platform/db/index.ts` and injected via tRPC context (`src/server/platform/context.ts`).

## Trip planner APIs
- `TOMTOM_API_KEY`: TomTom Long Distance EV Routing prefetch (`computeEvRoute` → `src/server/capabilities/evRouting/adapters/tomtom/longDistanceEv.ts`) supplies corridor geometry + charger-hint anchors for the plan agent.
- `MAPBOX_TOKEN`: Mapbox Places + final `getDirections` polyline in plan agent tools (unchanged UX contract).
- Plan LLM (`GEMINI_API_KEY`, optional `GEMINI_MODEL` in `src/server/capabilities/ai/orchestration/getPlanModel.ts`): defaults to a Pro-class Gemini model through `@ai-sdk/google`. If you see structured-output failures (*No object generated* / parse errors) after the agent’s jsonrepair + repair pass, keep `GEMINI_MODEL` on a strong Pro-class model rather than downgrading to a smaller/Flash model for long itineraries.

## Repo Conventions
- Formatting/linting is Biome (`biome.json`): 2-space indent, single quotes, import organization via Biome.
- Path alias `#/` points to `src/*` (defined in `package.json` imports + `tsconfig.json` paths); `#/styled-system/*` maps to repo-root `styled-system/*` for Panda output.
- Keep claims in docs aligned with executable config: CI runs on every PR via `.github/workflows/ci.yml` (Bun install + `bun run check` + `bun test`).
- **Frontend features** — Product UI and logic for a vertical slice live under `src/features/<name>/` with `components/` (and optional colocated areas such as `map/` for plan), `hooks/` (effects and subscriptions), `types/` (schemas and shared TS types), and `utils/` (pure helpers and static data). Cross-cutting workflow state for a feature may stay at `src/features/<name>/store.ts` (Zustand). Route files in `src/routes/**` stay thin and compose from `features/` and `src/components/` (`ui/`, `layout/`, `branding/`).
- **Backend** — Server code under `src/server/`: `platform/` holds shared infrastructure (DB in `platform/db/`, tRPC composition in `platform/trpc/`, request context in `platform/context.ts`); `modules/<domain>/` exposes domain routers wired into the app router; `capabilities/<area>/` holds capability code with **domain** logic (`domain/`, pure types) separated from **adapters** (`adapters/<vendor>/`) and orchestration (`orchestration/`, `tools/`, `prompts/`); `integrations/<vendor>/` is for third-party SDK-style clients; top-level `oauth/` is shared OAuth PKCE/state/cookie plumbing used by route handlers.

## Code quality & structure

- **Single responsibility** — Prefer one clear reason to change per file (e.g. HTTP client vs pure parsing vs prompt strings). When a module grows multiple unrelated concerns, split along those seams.
- **Folders express dependency direction** — Use directories to separate stable core from adapters (e.g. provider-agnostic `src/server/capabilities/evRouting/domain/` vs vendor-specific `src/server/capabilities/evRouting/adapters/tomtom/`). New external integrations should get their own colocated area instead of inflating an existing catch-all file.
- **Orchestration vs pure logic** — Keep I/O and framework glue (routers, `streamText`, tool wiring) separate from pure helpers (formatting, parsing, prompt blocks). Pure functions are easier to test and reuse; orchestration stays thin.
- **Small public surfaces** — Export only what callers need; keep helpers module-private so internal refactors don’t ripple across the codebase.
- **Prefer direct imports over barrels** — Skip `index.ts` re-exports unless there is a strong reason; they obscure origins and complicate search and tree-shaking.

## State Management & Hooks

- Form values live in TanStack Form. Don't mirror them into another store; project from the form via `useStore(form.store, selector)` when other parts of the UI need to react.
- Workflow / cross-component UI state lives in Zustand (e.g. `src/features/plan/store.ts`). Stores hold data + synchronous transitions only — no timers, no async, no derived `useEffect`.
- Side effects (timers, mutations, subscriptions) live in single-purpose hooks under `src/features/<name>/hooks/` named for what they do (e.g. `usePlanSubmit`, `useDraftRequest`). One hook = one effect.
- Components read state via colocated Zustand selectors (e.g. `useStatus`, `useResult`) and dispatch actions. They don't receive a "flow blob" prop and don't own workflow state.
- Every piece of state has exactly one writer. Don't sync two stores; project from one into the other.
- See `.agents/skills/linear-state-management/SKILL.md` for the full pattern.

## Auth / Local Testing
- Auth is handled by Clerk (`@clerk/tanstack-react-start`). Two entry points live at `/sign-in` and `/sign-up` — both offer Google SSO and an email-code (OTP) fallback rendered by `src/features/auth/components/EmailCodeForm.tsx`.
- For local development, running agents, and anything that shouldn't touch Google OAuth: use a Clerk **test email** (any address containing the `+clerk_test` subaddress, e.g. `devin+clerk_test@ev-agent.test`). On development Clerk instances, no email is sent and the verification code is always `424242`. See [Clerk's test emails docs](https://clerk.com/docs/guides/development/testing/test-emails-and-phones).
- Set `VITE_TEST_USER_EMAIL` in `.env` (template in `.env.example`) to prefill the sign-in / sign-up form with the test address in dev. The prefill + hint only render when `import.meta.env.DEV` is true.
- Email OTP must be enabled on the Clerk instance: Dashboard → User & authentication → Email → **Sign-in with email: Email verification code**. Dev instances have this pre-enabled by default; prod instances don't (and shouldn't use test emails anyway).

## Agent skills

### Issue tracker

Issues and PRDs live as markdown under `.scratch/<feature-slug>/` (not GitHub Issues). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles use the default strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` and `docs/adr/` when present. See `docs/agents/domain.md`.
