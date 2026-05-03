# EV-Agent

EV-Agent is a one-shot day-trip planner that turns a **Driver**'s origin, destination, vehicle, and chosen vibes into a charge-aware **Itinerary** they can drive today.

## Language

### The Trip

**Plan Request**:
The **Driver**'s submitted intent: origin, destination, chosen **Activities**, and **Vehicle Energy Profile** snapshot. Always for "today" — the planner is one-shot day-trip.
_Avoid_: query, params, form data.

**Itinerary**:
The finalized output of one planning run: ordered **Stops**, drawn **Geometry**, **Totals**, and narrated **Phases**.
_Avoid_: plan (the noun), result, route.

**Stop**:
One ordered point on the **Itinerary** with arrival time, dwell, kind, and coordinate.
_Avoid_: waypoint, node, leg endpoint.

**Stop Kind**:
`start`, `activity`, `charge`, or `end` — the entire vocabulary of stop types.
_Avoid_: rest stop, hop, segment.

**Activity**:
A **Driver**-selectable vibe paired to one activity **Stop** on the **Itinerary** (e.g. coffee, hike, tacos).
_Avoid_: POI, interest, category.

**Charge Stop**:
A **Stop** of kind `charge` placed at a real DC fast-charging station the **Vehicle**'s **Connectors** accept.
_Avoid_: charger, plug, supercharger (network-specific brand).

**Geometry**:
The road-following polyline drawn for the **Itinerary** on the map.
_Avoid_: path, line, route shape.

**Totals**:
Aggregated miles, drive minutes, dwell minutes, and stop counts for the **Itinerary**.
_Avoid_: summary, stats.

**Phase**:
One labeled step of the planning narration (e.g. cross-referencing chargers, finalizing itinerary).
_Avoid_: stage, status.

### The Vehicle

**Vehicle**:
The persisted row — exactly one per **Driver** — that records identity (make, model, year, optional VIN, optional Tesla vehicle id) plus **Driver**-tunable preferences (target arrival **SOC**, post-charge **SOC**) and any **Energy Profile Override** values.
_Avoid_: car (the row), profile (the row).

**Vehicle Catalog**:
The static, Tesla-only `(make, model, year) -> energy facts` lookup under `src/server/capabilities/vehicles/domain/catalog.ts`. Provides usable range, pack kWh, Wh/mi, and accepted **Connectors** for every catalog hit. Non-Tesla **Vehicles** fall through to platform defaults.
_Avoid_: vehicle database, model table.

**Vehicle Energy Profile**:
The **derived** read model the **Plan Agent** consumes. Resolved at read time as `(Energy Profile Override) -> (Vehicle Catalog hit) -> platform default`, plus the **Driver**'s **SOC** preferences. Includes usable range, pack kWh, starting **SOC**, arrival-floor **SOC**, Wh/mi consumption, accepted **Connectors**, post-charge **SOC**.
_Avoid_: car config, battery settings.

**Energy Profile Override**:
A nullable column on the **Vehicle** row that clobbers a **Vehicle Catalog** value (e.g. lower kWh for a degraded pack, custom Wh/mi). Setting an override to `null` returns the field to the **Vehicle Catalog** value as the catalog evolves.
_Avoid_: custom value, manual override (when context already says vehicle).

**Connector**:
A physical plug standard the **Vehicle** accepts: `NACS`, `CCS1`, `J1772`, `TYPE_2`, `CHADEMO`.
_Avoid_: plug type, port.

**SOC**:
State-of-charge as a percent (0–100); written `SOC`, not spelled out in product copy.
_Avoid_: charge level, battery %.

### EV routing prefetch

**Corridor**:
The lat/lng polyline long-distance EV routing returns (or a straight-line fallback) that bounds where **Stops** may live.
_Avoid_: route preview, path.

**Charge Region**:
A suggested anchor point near which a **Charge Stop** should land, with rationale and dwell hint.
_Avoid_: charger candidate, suggested charger.

**EV Preplan**:
The grounded payload (**Corridor** + **Charge Regions** + summary) fed to the **Plan Agent** before it builds the **Itinerary**.
_Avoid_: routing context, prefetch result.

### The Plan Agent

**Plan Agent**:
The LLM-driven planner that consumes a **Plan Request**, **EV Preplan**, and tools, and emits the streamed **Itinerary**.
_Avoid_: AI, model, assistant.

**Plan Tool**:
One of the four tools the **Plan Agent** calls: `narrateProgress`, `searchPlaces`, `findChargingStations`, `getDirections`.
_Avoid_: function call, action.

**Narration**:
Short **Driver**-readable strings the **Plan Agent** emits while working; shown in the planning UI with a cap.
_Avoid_: log line, message.

### Identity and integrations

**Driver**:
The human using EV-Agent; may have linked **Provider Accounts**.
_Avoid_: user (the word), customer, account holder.

**User**:
The internal identity row; external auth ids are columns on **User**, never primary keys on other tables.
_Avoid_: account, profile.

**Provider**:
An external OAuth integration EV-Agent can talk to (e.g. Tesla).
_Avoid_: integration (the noun), service.

**Provider Account**:
One **Driver**'s link to one **Provider**, holding encrypted access and refresh tokens.
_Avoid_: connection, OAuth row.

## Relationships

- A **Driver** maps to exactly one **User**; a **User** has zero or more **Provider Accounts** (at most one per **Provider**) and at most one **Vehicle**.
- A **Vehicle Energy Profile** is **derived** from one **Vehicle** + the **Vehicle Catalog** at read time; it is never persisted as a single row.
- A **Plan Request**, **Vehicle Energy Profile**, and **EV Preplan** produce one **Itinerary** via the **Plan Agent**.
- An **Itinerary** has two or more **Stops** (exactly one `start` and one `end`); zero or more **Charge Stops** and activity **Stops** in between.
- An **EV Preplan** has one **Corridor** and zero or more **Charge Regions**; each **Charge Region** anchors at most one **Charge Stop**.
- Each **Activity** the **Driver** selects should yield exactly one activity **Stop** on the **Itinerary**, or an explicit narrated omission.

## Example dialogue

> **Dev:** "When the **Driver** picks coffee + tacos, do we always create two activity **Stops**?"
> **Domain expert:** "Yes — one **Stop** per selected **Activity**, ordered along the **Corridor**. If we genuinely can't fit one without busting the **SOC** arrival floor, the **Plan Agent** narrates the omission instead of silently dropping it."
> **Dev:** "And a **Charge Stop** only counts if it sits inside a **Charge Region**?"
> **Domain expert:** "**Charge Regions** are anchors when prefetch is strong. Without that, we don't pretend they exist — `findChargingStations` picks the **Charge Stop** and the **Plan Agent** justifies it from the **Corridor** + **SOC** math."

## Flagged ambiguities

- "**plan**" was used to mean the submitted **Plan Request**, the finished **Itinerary**, and the act of planning. **Resolved:** noun output is **Itinerary**, input is **Plan Request**; the verb stays "plan".
- "**user**" meant both the human (**Driver**) and the row (**User**). **Resolved:** **Driver** is the human; **User** is the row.
- "**charger**" / "**charging stop**" / "**supercharger**" were used interchangeably. **Resolved:** **Charge Stop** for the itinerary entry; "DC fast charger" for the physical site; avoid "supercharger" as generic vocabulary.
- "**route**" overlapped with **Geometry**, **Corridor**, and **Itinerary**. **Resolved:** **Geometry** is the drawn polyline; **Corridor** is prefetch shape; **Itinerary** is the whole plan; "route" only in casual prose.
- "**vehicle**" was used both for the persisted row and for the per-trip energy snapshot. **Resolved:** the persisted row is the **Vehicle**; the read-time energy view is the **Vehicle Energy Profile**; per-field clobbers on the **Vehicle** row are **Energy Profile Override**s.
