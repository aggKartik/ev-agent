/**
 * Plan-feature helpers shared between server and client.
 *
 * Address suggestions used to be a fixture lookup here; that responsibility
 * now lives behind the `addresses` capability + Mapbox adapter and is
 * exposed via `plan.suggestAddresses` / `plan.retrieveAddress`. The client
 * receives `PlanAddress` values with real `coordinate` fields, so the
 * historical hash-based fallback in `resolvePlanCoordinate` is gone.
 *
 * `getPlanActivityCatalog` is the single source for the activity catalog
 * surfaced to both the plan form (chip selector) and the agent prompt.
 */

import type { Coordinate } from '#/lib/geoTypes';
import type { PlanActivityCatalog, PlanAddress } from '#/shared/plan/contracts';
import { PLAN_ACTIVITY_CATALOG } from '#/shared/plan/data';

export function getPlanActivityCatalog(): PlanActivityCatalog {
  return PLAN_ACTIVITY_CATALOG;
}

/**
 * Pull the lat/lng off a `PlanAddress` if one has been resolved. The plan
 * request schema requires the coordinate at submit time, but draft-state
 * helpers (map preview, route layers, EV-routing prefetch fallbacks) call
 * this while the **Driver** is still typing — so we return `null` rather
 * than throw.
 */
export function tryResolvePlanCoordinate(
  address: PlanAddress | undefined,
): Coordinate | null {
  return address?.coordinate ?? null;
}

/**
 * Variant for code paths that have already validated the address through
 * `planRequestSchema` (e.g. the server EV-routing capability). Throws if
 * the coordinate is missing — that is a contract violation, not a user
 * input case.
 */
export function resolvePlanCoordinate(address: PlanAddress): Coordinate {
  if (!address.coordinate) {
    throw new Error(
      'resolvePlanCoordinate: address has no coordinate; client must call plan.retrieveAddress before submitting (unreachable after planRequestSchema validation).',
    );
  }
  return address.coordinate;
}
