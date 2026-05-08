export function cleanPlanAddress(value: string) {
  const parts = value.split(',');
  return parts.slice(0, 2).join(',').trim() || value;
}

export function formatPlanMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
