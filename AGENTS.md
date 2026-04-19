# AGENTS.md

## Quick Start Commands
- Use Bun for everything (`bun install`, not npm/pnpm/yarn).
- Dev server: `bun dev` (Vite on port `3000`).
- Quality checks: `bun run check` (Biome lint+format), `bun run lint`, `bun run format`.
- Tests: `bun test` (configured as `vitest run --passWithNoTests`, so empty suites still exit 0).
- Production build: `bun run build` (runs `prepare` first, then Vite build).

## Generated Files (Do Not Hand Edit)
- `src/routeTree.gen.ts` is TanStack Router generated output; treat as read-only.
- `styled-system/` is Panda CSS generated output (gitignored); regenerate via `bun run prepare` after token/recipe/config changes.

## App Wiring That Is Easy To Miss
- File routes live in `src/routes/**`; current user-facing routes are `/` and `/onboarding/`.
- tRPC HTTP handler is wired through `src/routes/api.trpc.$trpc.ts` at `/api/trpc`.
- OAuth connect/callback handlers live at `src/routes/api.oauth.$provider.connect.ts` and `src/routes/api.oauth.$provider.callback.ts` (URLs `/api/oauth/:provider/connect` and `/api/oauth/:provider/callback`).
- Client tRPC setup is in `src/lib/trpc.ts`; server router composition is in `src/server/routers/index.ts`.
- Root providers (QueryClient, tRPC provider, devtools, global CSS) are in `src/routes/__root.tsx`.

## Database / Local Infra
- Local Postgres is managed with `docker-compose.dev.yml` via `bun run db:start` / `bun run db:stop`.
- Required env var for DB work: `DATABASE_URL` (see `.env.example`).
- Run migrations with `bun run db:migrate`; full rollback helper: `bun run db:migrate:reset`.
- Kysely DB singleton is created in `src/server/db/index.ts` and injected via tRPC context (`src/server/context.ts`).

## Repo Conventions
- Formatting/linting is Biome (`biome.json`): 2-space indent, single quotes, import organization via Biome.
- Path alias `#/` points to `src/*` (defined in `package.json` imports + `tsconfig.json` paths).
- Keep claims in docs aligned with executable config: this repo has no CI workflow files at `.github/workflows/`.
