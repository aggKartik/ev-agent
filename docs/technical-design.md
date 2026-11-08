# Technical design

ev/agent builds a day-trip itinerary from a Driver's destination, activities, and vehicle energy settings. The planner coordinates those inputs with several external services while streaming progress and stops to the interface.

## From form to itinerary

1. **Resolve the vehicle settings.** `plan.context` loads the saved Vehicle and derives its Vehicle Energy Profile. Saved overrides take priority over the catalog and platform defaults. Available Tesla battery telemetry supplies the initial starting SOC; the Driver can adjust it on the form.
2. **Validate the Plan Request.** Origin and destination need resolved coordinates. Each selected Activity includes dwell time and a preferred position along the trip. The shared Zod schema validates the request before planning starts.
3. **Reserve a planning slot.** The authenticated `plan.stream` subscription applies per-Driver concurrency and rate limits and creates the cancellation and timeout signals.
4. **Prefetch EV routing.** TomTom Long Distance EV Routing provides a Corridor and suggested Charge Regions. These are sampled into the EV Preplan sent to the agent.
5. **Run the Plan Agent.** Gemini receives the Plan Request, EV Preplan, and four tools: `narrateProgress`, `searchPlaces`, `findChargingStations`, and `getDirections`. Mapbox supplies places and directions; OpenChargeMap supplies station candidates.
6. **Stream progress and stops.** tRPC sends tracked events for phases, progress, narration, tool activity, and validated stops. The client dispatches them into the planning store.
7. **Apply the final result.** The server validates the structured model output and attaches the original Plan Request. The client switches to the Leaflet map and itinerary timeline, with shared stop selection between them.

The EV Preplan guides the model's choices. It isn't a separate proof that the final generated itinerary is energy-feasible. Likewise, station search data doesn't establish live charger availability.

## Why routing happens before generation

The agent needs a useful search area and charging guidance before choosing activities. TomTom supplies that context from the vehicle's energy inputs and the trip endpoints. The prompt asks the agent to use suggested charging areas when pairing activities with charging stops, and to explain contradictions found through its tools.

The final driving geometry comes from Mapbox directions after the agent has chosen the stops. This keeps the initial EV routing context separate from the final itinerary.

If TomTom doesn't return a usable route, the preplan falls back to a straight-line corridor with no charging anchors. If prefetch throws, orchestration continues without a preplan. In either case, the agent is instructed to find charging stations through its tools rather than invent charging guidance.

## Streaming and failure handling

The client workflow has three states: `draft`, `planning`, and `ready`. A request starts the subscription; a final result moves it to `ready`; a failure returns it to `draft` with an error message.

- Individual stops are schema-validated before being emitted and deduplicated by ID.
- Narration is capped at 80 entries in the client store.
- A single planning stream has a 90-second timeout, and tool calls receive the abort signal.
- Each Driver gets one concurrent stream and up to five starts per minute within one server process.
- When structured output generation fails, recovery first tries parsing and JSON repair, then a separate structured model repair call. An unrecovered failure becomes an error event.
- Subscription cleanup waits for the agent task and releases the reserved slot in `finally`.

The stream guards and Tesla response cache use process-local Maps. Multiple replicas have separate counters and cached values. Shared limits or cache consistency would need an external store.

## Vehicle data and identity

Clerk authenticates the Driver. A separate internal User row owns the Vehicle and Provider Accounts; external identity IDs aren't used as foreign keys throughout the application.

One Vehicle is saved per Driver. Its energy profile is computed at read time:

```text
Saved energy overrides → vehicle catalog → platform defaults
```

An override set to `null` falls back to the catalog, allowing updated catalog values to take effect without backfilling resolved profiles. See [ADR 0001](adr/0001-vehicle-as-derived-profile.md).

Tesla OAuth uses shared PKCE/state/cookie handling. Access and refresh tokens are encrypted at rest with AES-256-GCM, and the integration refreshes access tokens when needed. Fleet telemetry is cached separately from the saved Vehicle identity and preferences.

Send to Tesla checks deployment capability, OAuth command scope, and the target vehicle before sending navigation waypoints. It remains disabled by default until the configured command proxy has verified support. [Proxy setup and limitations](tesla-command-proxy.md).

## Frontend boundaries

| Concern | Owner |
| --- | --- |
| Editable planning inputs | TanStack Form |
| Server queries and caching | TanStack Query through tRPC |
| Planning status, streamed stops, narration, and selection | Zustand |
| Subscriptions, mutations, timers, and map updates | Feature hooks |
| Presentation | Feature components and shared UI |

Form values aren't mirrored into the workflow store while editing. On submission, a validated Plan Request becomes the active request snapshot. Components read focused selectors and dispatch synchronous store actions; hooks handle the I/O.

Backend capabilities separate pure domain logic from vendor adapters and orchestration. For example, vehicle energy resolution is a pure function, TomTom HTTP work sits in an adapter, and plan orchestration coordinates the prefetch and model execution.

## Code entry points

| Area | Start here |
| --- | --- |
| Plan API and subscription | [`modules/plan/router.ts`](../src/server/modules/plan/router.ts) |
| EV prefetch orchestration | [`modules/plan/streamProgress.ts`](../src/server/modules/plan/streamProgress.ts) |
| EV Corridor and fallback | [`computeEvRoute.ts`](../src/server/capabilities/evRouting/domain/computeEvRoute.ts) |
| Model orchestration and tools | [`ai/orchestration/planAgent.ts`](../src/server/capabilities/ai/orchestration/planAgent.ts) |
| Model output recovery | [`ai/parsing/planAgentRecovery.ts`](../src/server/capabilities/ai/parsing/planAgentRecovery.ts) |
| Shared request and result schemas | [`shared/plan/contracts.ts`](../src/shared/plan/contracts.ts) |
| Vehicle energy resolution | [`resolveEnergyProfile.ts`](../src/server/capabilities/vehicles/domain/resolveEnergyProfile.ts) |
| Client subscription and event dispatch | [`usePlanSubmit.ts`](../src/features/plan/hooks/usePlanSubmit.ts) |
| Client workflow | [`features/plan/store.ts`](../src/features/plan/store.ts) |
| Itinerary map and timeline | [`ItineraryStage.tsx`](../src/features/plan/components/ItineraryStage.tsx) |
| OAuth token encryption | [`oauth/crypto.ts`](../src/server/oauth/crypto.ts) |

## Verification

Vitest covers request contracts, energy-profile resolution, output parsing, stream guards, workflow transitions, and integration error handling. `bun run smoke:tools` exercises planning tools and EV prefetch against external APIs without invoking the LLM.

`bun run check` runs TypeScript, Biome, coverage tests, and fallow's baseline-aware audit. CI runs it alongside `bun run test` on pull requests and pushes to `main`.
