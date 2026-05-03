# ADR 0001 — Vehicle Energy Profile is a derived read model

Status: accepted (2026-05-03)

## Context

The original product flow had three structural gaps:

1. Onboarding collected `make / model / year` into `sessionStorage` and dropped them on the floor at the SUCCESS step. Nothing reached the database.
2. The plan form's vehicle defaults came from hard-coded `PLAN_DEFAULT_*` constants. The **Driver** had to retype range, kWh, Wh/mi, and connectors every trip — even after linking Tesla.
3. The dashboard's car panel and the plan form's `Current location` chip were both hard-coded fixtures. The Tesla integration existed but never reached the UI.

We needed a single source of truth for "what does this **Driver** drive, and what does the **Plan Agent** assume about it?".

## Decision

Adopt a derived read model: the **Vehicle Energy Profile** is computed at read time from three layers, in priority order:

```text
Energy Profile Override  ->  Vehicle Catalog hit  ->  PLAN_DEFAULT_*
```

- **Layer 1 — Vehicle row.** New `vehicles` table, 1:1 with `users`, persists identity (`make / model / year / vin / tesla_vehicle_id`), **Driver** preferences (`target_arrival_soc_percent`, `post_charge_soc_percent`), and nullable `override_*` columns.
- **Layer 2 — Vehicle Catalog.** Static, Tesla-only `(make, model, year) -> { usableRangeMiles, batteryCapacityKWh, consumptionWhPerMile, connectorTypes }` table at [`src/server/capabilities/vehicles/domain/catalog.ts`](../../src/server/capabilities/vehicles/domain/catalog.ts). Edited as a normal PR.
- **Layer 3 — Defaults.** The historical `PLAN_DEFAULT_*` constants in [`src/shared/plan/constants.ts`](../../src/shared/plan/constants.ts).

The merger lives in [`resolveEnergyProfile`](../../src/server/capabilities/vehicles/domain/resolveEnergyProfile.ts) — pure, deterministic, fully unit-tested.

When the **Driver** edits a vehicle field on the plan form and submits, the client diffs the form values against the resolved profile (the same merger run client-side) and persists only the truly-divergent fields as overrides via [`vehicle.upsertOverrides`](../../src/server/modules/vehicles/router.ts). A field that matches the catalog is set to `null`, so future catalog updates flow through automatically.

## Consequences

- **Onboarding is atomic.** SUCCESS step calls `vehicle.completeOnboarding`, which inserts the row idempotently (`ON CONFLICT (user_id) DO NOTHING`). On success, navigates to `/dashboard`.
- **Three redirect gates** (`/dashboard`, `/plan` require a row; `/onboarding` redirects to `/dashboard` if a row exists, unless `?force=1`). The "Re-run setup" link in the dashboard car panel uses `?force=1`.
- **Tesla wins for everything it knows.** When linked, Tesla's VIN-decoded make/model/year fills the row at onboarding time. Live SOC / range / odometer / GPS are never persisted — they're cached in-memory for 10 minutes via [`fleet/cache.ts`](../../src/server/integrations/tesla/fleet/cache.ts) and surfaced fresh by `tesla.refresh`, the dashboard's Refresh button, and `tesla.currentLocation`.
- **Address autocomplete is real.** The Mapbox Search Box adapter ([`mapbox/searchbox.ts`](../../src/server/integrations/mapbox/searchbox.ts)) replaces the old hash-fallback `MOCK_ADDRESSES`. Session tokens make the typeahead free; only the final retrieve is billed.
- **Current location is honest.** `useCurrentLocation` resolves Tesla GPS first, then `navigator.geolocation`, then nothing. The chip label reads `AUTO · FROM CAR` or `AUTO · THIS DEVICE` accordingly.
- **The `dates` field is gone.** CONTEXT specifies a one-shot day-trip; the agent receives `today` server-side.
- **The PREFS step is gone.** Onboarding vibes were never wired anywhere. Activity selection happens on the plan form per trip.

## Rejected alternatives

- **Persist the resolved profile as a table column.** Rejected because catalog updates would not propagate; every catalog PR would need a backfill.
- **Treat manual entry as ground truth, Tesla as prefill only.** Rejected — defeats the point of linking.
- **External EV-specs API for layer 2.** No free option covers usable range + kWh + Wh/mi + connectors together; paid options add a vendor without solving anything the static catalog can't.
- **Multi-vehicle per Driver.** Out of scope; can be added later by relaxing the `user_id UNIQUE` constraint and introducing a primary-vehicle flag, with no change to the merger.

## Migration notes

- `004_vehicles.ts` creates the new table.
- `005_drop_legacy_cars.ts` drops the unused `cars` / `user_cars` tables from migration `001`. The `down` recreates the original schema verbatim, so the migration is reversible.
