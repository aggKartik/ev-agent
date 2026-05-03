/** Max agent steps (tools + final structured output need headroom). */
export const PLAN_AGENT_MAX_STEPS = 20;

/** Final itinerary JSON can be large (geometry polyline). */
export const PLAN_AGENT_MAX_OUTPUT_TOKENS = 12_000;

/** Raw model text fed into the LLM repair prompt (character cap). */
export const PLAN_AGENT_REPAIR_SNIPPET_MAX_CHARS = 14_000;

export const PLAN_AGENT_REPAIR_MAX_OUTPUT_TOKENS = 8192;
