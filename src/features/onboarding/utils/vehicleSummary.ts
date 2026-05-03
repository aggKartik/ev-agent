/**
 * One-line summary for Tesla identity shown during onboarding (connect + success).
 */
export function onboardingVehicleSummary(
  teslaVehicle: {
    displayName?: string | null;
    year?: string | null;
    make?: string | null;
    model?: string | null;
  } | null,
): string {
  if (!teslaVehicle) return '';

  const displayName = teslaVehicle.displayName?.trim();
  const lineage = [
    teslaVehicle.year ?? null,
    teslaVehicle.make ?? null,
    teslaVehicle.model ?? null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return [displayName, lineage || null].filter(Boolean).join(' · ');
}
