# Clerk auth — test plan (PR #6)

## What changed
Branch `devin/1776617087-clerk-auth` adds Clerk-based Google-only auth. Landing stays public; `/onboarding/*` is server-protected. New routes: `/sign-in`, `/sign-up`, `/sso-callback`. The most recent commit (`b1ce680`) refactors the auth pages onto existing design-system primitives (`step` recipe kicker slot, `Text textStyle="mono-meta"`, a shared `Spinner`, and a new `font="mono"` variant on the `button` recipe used by Header's Sign out), and addresses the three Devin Review findings: (1) wraps the SSO callback async IIFE in try/catch and redirects to `/sign-in` on failure; (2,3) guards `signIn` / `signUp` undefined before calling `.sso()`.

## Primary adversarial flow (single recording)

Testing environment: local `bun dev` on http://localhost:3000 with Clerk **test** keys in `.env`. Browser: Chrome on the VM desktop.

For each step the plan lists the **action** and the **pass/fail criteria with concrete expected values**. Each assertion is designed so the same action would look visibly different if the change were broken.

### T1 — Landing is public
- **Action:** Navigate to `http://localhost:3000/`.
- **Pass:** Page renders the EV Agent landing hero (headline contains the word “Electric” or similar display text) with HTTP 200. Header is visible but shows **no** “Sign out” button (because we are signed out — per `Header.tsx:89-91` `<Show when="signed-in">` guard).
- **Broken-state difference:** If `/` were accidentally wrapped in the `beforeLoad` guard, the browser would redirect to `/sign-in` (307 from server) and we would never see landing content.
- **Source of truth:** `src/routes/index.tsx`, `src/components/Header.tsx:89-91`.

### T2 — `/onboarding` is server-side protected
- **Action:** With no cookie, navigate to `http://localhost:3000/onboarding`.
- **Pass:** Browser ends up on `/sign-in` (URL changes). The server issues a 307 redirect (already confirmed via `curl`: `GET /onboarding → 307 Location: http://localhost:3000/sign-in`).
- **Broken-state difference:** If the `beforeLoad` `requireAuthFn` were broken, we'd land on the onboarding wizard content instead of `/sign-in`.
- **Source of truth:** `src/routes/onboarding/route.tsx:5-13` (`createServerFn` calling `auth()` and `redirect({ to: '/sign-in' })`).

### T3 — Sign-in UI renders from design system (refactor assertion)
- **Action:** On `/sign-in`, inspect the rendered card.
- **Pass (all must hold):**
  1. A **kicker** reading `SIGN IN` is visible, styled mono-uppercase, **peach-colored** (`peach.400`), with a short horizontal bar to its left (the `::before` pseudo-element of `step({ single: true }).kicker` per `src/styles/recipes/step.ts:44-58`). This proves the kicker uses the design-system `step.kicker` slot and not a hand-rolled class.
  2. Heading text `Welcome back.` with “back” rendered in italic (via `<em>`).
  3. Description: `Continue with Google to pick up where you left off.`
  4. A single **Google button** with the Google “G” icon and label `Continue with Google` is the only CTA in the actions row.
  5. A secondary line reads `New here? Create an account`, where `Create an account` is a link that routes to `/sign-up`.
- **Broken-state difference:** If the refactor regressed, the kicker would either lose the horizontal-bar pseudo (indicating we’re no longer using `stepClasses.kicker`) or its color would drift; the Google button would lose its border (ghost variant) or icon.
- **Source of truth:** `src/routes/sign-in/index.tsx:55-89`, `src/styles/recipes/step.ts`, `src/components/auth/GoogleButton.tsx`.

### T4 — Google button guard against Clerk not ready (Devin Review #2)
- **Action:** Open `/sign-in`, immediately click `Continue with Google` as fast as possible (single click). Repeat once more after clearly waiting for the page to settle.
- **Pass:**
  - On the quick click, **no** uncaught `TypeError: Cannot read properties of undefined (reading 'sso')` appears in the DevTools Console. The button either becomes busy (shows the `<Spinner />` from the `loading` prop) or no-ops silently.
  - On the settled click, the button enters the `loading` state (spinner visible instead of the Google “G”) and the browser begins Clerk's OAuth redirect (URL changes toward `accounts.google.com` or Clerk’s FAPI). Note: we will **stop** before entering Google credentials because no throwaway Google account is available.
- **Broken-state difference:** Without the `if (!signIn) return;` guard, the console would contain the TypeError on a fast click.
- **Source of truth:** `src/routes/sign-in/index.tsx:33-51`.

### T5 — Sign-up guard is symmetric (Devin Review #3)
- **Action:** Navigate to `/sign-up`, click `Continue with Google` immediately.
- **Pass:** No `TypeError` in Console; same observable behaviour as T4 (button enters loading state and kicks off OAuth).
- **Broken-state difference:** Same as T4 but for `useSignUp().signUp`.
- **Source of truth:** `src/routes/sign-up/index.tsx:33-51`.

### T6 — SSO callback fails safely (Devin Review #1, most important adversarial test)
- **Action:** Navigate directly to `http://localhost:3000/sso-callback` (no OAuth state in URL, no in-flight Clerk transaction). This forces `signIn` / `signUp` to be in an `incomplete` status with no `existingSession`, and causes the final `clerk.setActive({ session: undefined })` path to be skipped; any code path that tries to `finalize()` throws because the handshake is incomplete.
- **Pass (all must hold):**
  1. The spinner (`Spinner` component from `src/components/Spinner.tsx`, rendered at 32px with label `Completing sign-in…` per `src/routes/sso-callback/index.tsx:138-147`) appears briefly.
  2. Within a few seconds the browser URL changes to `/sign-in`. This proves the `catch` block ran and `navigateToSignIn()` fired.
  3. DevTools Console shows exactly one `SSO callback failed:` error, but **no** unhandled promise rejection warning.
- **Broken-state difference:** Before the fix (commit `e913187`), this same navigation left the user stuck on the spinner indefinitely with an unhandled rejection in the console. A working fix vs. a broken fix produce **visibly different outcomes** (redirect vs. hang).
- **Source of truth:** `src/routes/sso-callback/index.tsx:36-135` — specifically the `try { ... } catch (err) { console.error(...); hasRun.current = false; navigateToSignIn(); }` block added in `b1ce680`.

### T7 — Header Sign out uses refactored Button, appears only when signed in
- **Action:** While on `/sign-in` (signed out), inspect Header. Then (if we had a live session) the same Header on `/onboarding` would show Sign out.
- **Pass (signed-out):** Header shows the EV Agent logo and meta pill; **no** “Sign out” button anywhere.
- **Pass (signed-in, untested in this run):** Would render a `<Button variant="ghost" size="sm" font="mono">Sign out</Button>` — a pill button with uppercase mono font. Since we cannot complete Google sign-in without credentials, we document this assertion as **untested** in the report.
- **Source of truth:** `src/components/Header.tsx:56-67, 89-91`, `src/styles/recipes/button.ts:64-73` (new `font` variant).

## Explicitly out of scope / untested
- Real Google OAuth completion and post-auth landing at `/onboarding` — no throwaway Google credentials available; the test will visibly stop at the Clerk/Google redirect in T4 and T5.
- Railway deployment — currently failing due to missing `CLERK_*` env vars on Railway, unrelated to the code in this PR; the user has been notified.

## Evidence to capture
- Continuous screen recording covering T1–T7, with `record_annotate` markers at each `Tn`.
- For T6 (the most important adversarial test), capture a DevTools Console screenshot showing the `SSO callback failed:` error and the URL bar settling on `/sign-in`.
- Post a single consolidated comment on PR #6 with pass/fail bullets and the recording.
