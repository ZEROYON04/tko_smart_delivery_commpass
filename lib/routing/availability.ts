export function latestAvailability(
  availableFrom: string | null,
  unavailableUntil: string | null,
) {
  const candidates = [availableFrom, unavailableUntil]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));

  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((value) => value.getTime()))).toISOString();
}
