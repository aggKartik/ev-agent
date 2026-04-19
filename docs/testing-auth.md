# Test-user auth

Production users sign in with Google OAuth. That flow is not usable from a
local dev environment or from an AI agent running headless — nobody is there
to click through Google's consent screen, and Google blocks most automated
browsers anyway.

To unblock those workflows the app exposes a second, Clerk-native path that
does not require Google: a **"Continue as test user"** button on
`/sign-in` and `/sign-up`. It signs you in as a predictable test account
using [Clerk's test-mode email flow][clerk-test-emails].

[clerk-test-emails]: https://clerk.com/docs/guides/development/testing/test-emails-and-phones

## How it works

Clerk treats any email containing the `+clerk_test` subaddress as a test
address when **test mode** is enabled:

- No email is ever sent to it.
- It can always be verified with the universal code **`424242`**.

Test mode is on by default for Clerk **development instances**, so no
dashboard configuration is required for the normal `pk_test_…` keys this
repo ships with.

The hook in `src/lib/useTestUserAuth.ts` drives the standard Clerk Future
API against that test address:

1. `signIn.create({ identifier: 'ev-agent-test+clerk_test@example.com' })`
2. `signIn.emailCode.sendCode()` — returns instantly because it's a test
   address.
3. `signIn.emailCode.verifyCode({ code: '424242' })`
4. `signIn.finalize()` — promotes the verified attempt to the active
   session.

If this is the first time the test user has been used on a given Clerk
instance (for example, a freshly provisioned dev instance), Clerk responds
with `form_identifier_not_found`. The hook catches that and falls through to
the equivalent sign-up sequence (`signUp.create` → `sendEmailCode` →
`verifyEmailCode` → `finalize`) to provision the user, then lands on
`/onboarding` just like the Google flow.

## Using it as a human

1. Run `bun dev`.
2. Open the app (the dev server prints the URL) and navigate to `/sign-in`
   or `/sign-up`.
3. Click **Continue as test user**.

You will be signed in as `ev-agent-test+clerk_test@example.com` and
redirected to `/onboarding`.

## Using it from an AI agent or E2E test

The button has a stable selector (`data-testid="test-user-button"`). From
Playwright, for example:

```ts
await page.goto('/sign-in');
await page.getByTestId('test-user-button').click();
await page.waitForURL(/\/onboarding/);
```

Because the flow uses `+clerk_test` and the `424242` code it does not hit
Google, does not send email, does not count toward Clerk's dev-instance
email quota, and does not require CAPTCHA solving — the "Bot traffic
detected" Clerk check is bypassed for test-mode identifiers.

If your test runner needs to bypass Clerk's bot detection more broadly (for
production instances, or for non-test identifiers), see Clerk's [Testing
Tokens][testing-tokens] and the `@clerk/testing` helpers. For the common
case of "I just need to be signed in", the button above is enough.

[testing-tokens]: https://clerk.com/docs/testing/overview

## Feature flag

The button is gated by `VITE_ENABLE_TEST_USER` (see
`src/lib/devFlags.ts`):

| `VITE_ENABLE_TEST_USER` | Behaviour                                         |
| ----------------------- | ------------------------------------------------- |
| _(unset)_               | Shown in dev builds (`import.meta.env.DEV`), hidden in prod builds. |
| `true` / `1`            | Force-shown (useful for preview/staging builds).  |
| `false` / `0`           | Force-hidden (useful for customer demos).         |

Because Vite inlines `import.meta.env.*` at build time, production bundles
without the flag never ship the button markup or the hook's code paths.

## Rotating / changing the test user

The test email is exported from `src/lib/useTestUserAuth.ts` as
`DEFAULT_TEST_USER_EMAIL`. Change it there if you want a different test
identity, or pass a custom email to `useTestUserAuth('your+clerk_test@…')`
from a one-off page. Any address using the `+clerk_test` subaddress works.

## Production safety

- The button is not rendered in production unless `VITE_ENABLE_TEST_USER`
  is explicitly set to a truthy value at build time.
- Even if it were rendered, Clerk's **production** instances reject the
  `+clerk_test` address unless test mode is turned on in the dashboard
  (which Clerk actively discourages). So the worst-case scenario for an
  accidental production deploy is a button that always errors out — not a
  bypass of real authentication.
