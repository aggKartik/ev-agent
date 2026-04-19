# Test-user auth

Production users sign in with Google OAuth. That flow is unusable from a
local dev machine or from an AI agent running headless — nobody is there
to click through Google's consent screen, and Google blocks most automated
browsers anyway.

To unblock those workflows the app exposes a **"Continue as test user"**
button on `/sign-in` and `/sign-up`. It signs you in as a dedicated test
account using [Clerk sign-in tokens][clerk-sign-in-tokens], bypassing
Google entirely.

[clerk-sign-in-tokens]: https://clerk.com/docs/references/backend/sign-in-tokens/create-sign-in-token

## Why sign-in tokens and not email/OTP

An earlier version of this flow tried Clerk's
[test-mode `+clerk_test` email][clerk-test-emails] subaddress with the
universal verification code `424242`. It failed:

```
{"errors":[{
  "message":"Identifier is invalid.",
  "code":"form_param_format_invalid",
  "meta":{"param_name":"identifier"}
}]}
```

Our Clerk instance only has Google OAuth enabled as a first factor —
"email address" is not a valid identifier for `signIn.create({ identifier })`,
regardless of whether the email uses the test subaddress. The Frontend
API's identifier validation happens before Clerk inspects the email
contents.

Clerk's documented workaround for exactly this situation is the
[**sign-in token**][clerk-sign-in-tokens] flow: the server uses
`CLERK_SECRET_KEY` to mint a single-use JWT for a specific user, and the
browser redeems the token directly into a session. Identifier
configuration is irrelevant because no identifier is ever submitted — the
token already names the user.

[clerk-test-emails]: https://clerk.com/docs/guides/development/testing/test-emails-and-phones

## How the flow works

```
Browser                            Our server                       Clerk BAPI
  │                                   │                                 │
  │  POST /api/auth/test-user-token   │                                 │
  │──────────────────────────────────▶│                                 │
  │                                   │  users.getUserList(externalId)  │
  │                                   │────────────────────────────────▶│
  │                                   │  (miss) users.createUser(...)   │
  │                                   │────────────────────────────────▶│
  │                                   │  signInTokens.createSignInToken │
  │                                   │────────────────────────────────▶│
  │                                   │◀────────── { token } ───────────│
  │◀────────── { ticket } ────────────│                                 │
  │                                                                     │
  │  signIn.create({ strategy: 'ticket', ticket })                      │
  │────────────────────────────────────────────────────────────────────▶│
  │◀──────── status: 'complete', createdSessionId ─────────────────────│
  │                                                                     │
  │  setActive({ session: createdSessionId })                           │
  │  navigate('/onboarding')                                            │
```

Files involved:

- `src/server/auth/testUser.ts` — `issueTestUserSignInToken()` find-or-
  creates a stable test user (matched by `externalId = 'ev-agent-test-user'`)
  and asks Clerk to mint a 60-second sign-in token.
- `src/routes/api.auth.test-user-token.ts` — POST handler that returns
  `{ ticket }`. Returns **404** if `ENABLE_TEST_USER_AUTH` is not `true`,
  so production builds don't even advertise the endpoint.
- `src/lib/useTestUserAuth.ts` — fetches the ticket, then redeems it via
  `signIn.create({ strategy: 'ticket', ticket })` + `setActive(...)`.
  Uses `@clerk/tanstack-react-start/legacy`'s Core 2 `useSignIn` because
  the Future API's `signIn.ticket()` is [known to leave status at
  `needs_identifier`][clerk-issue-8219] after redeeming a sign-in token.
- `src/components/auth/TestUserButton.tsx` — ghost-variant button with
  `data-testid="test-user-button"` for Playwright/agent drivers.

[clerk-issue-8219]: https://github.com/clerk/javascript/issues/8219

## Enabling it

Two env vars, both off by default:

| Variable                    | Scope   | Required | Purpose                                           |
| --------------------------- | ------- | -------- | ------------------------------------------------- |
| `ENABLE_TEST_USER_AUTH`     | Server  | Yes      | Enables the `/api/auth/test-user-token` endpoint. |
| `VITE_ENABLE_TEST_USER`     | Client  | No       | Overrides the dev-only visibility of the button.  |

For local dev just set both to `true` in `.env`. `CLERK_SECRET_KEY` must
also be set — the server uses it to call the Backend API.

## Using it as a human

1. `ENABLE_TEST_USER_AUTH=true bun dev`.
2. Open the app (the dev server prints the URL) and navigate to
   `/sign-in` or `/sign-up`.
3. Click **Continue as test user**.

You land on `/onboarding` signed in as the test user.

## Using it from an AI agent or E2E test

The button has a stable selector. From Playwright, for example:

```ts
await page.goto('/sign-in');
await page.getByTestId('test-user-button').click();
await page.waitForURL(/\/onboarding/);
```

If your test runner has direct access to the server env, setting
`ENABLE_TEST_USER_AUTH=true` for that environment is all it needs.

## Rotating / changing the test user

The test user's `externalId`, email, first/last name, and token lifetime
are constants at the top of `src/server/auth/testUser.ts`. Update them
there. Because we look the user up by `externalId` and not email, changing
the email is safe — existing deployments keep working until a Clerk admin
deletes the old user.

## Production safety

- `ENABLE_TEST_USER_AUTH` is **not** on in production, so the endpoint
  returns 404 and no sign-in tokens can be minted.
- Even when enabled, tokens are single-use JWTs with a 60-second lifetime.
  Each token authenticates exactly one test user.
- `VITE_ENABLE_TEST_USER` is inlined at build time, so production bundles
  without the flag never ship the button markup or the hook's code.
- The server endpoint does not accept any request body — there is no way
  to pivot it into signing in as an arbitrary user.
