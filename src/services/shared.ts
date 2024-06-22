export function getDistanceFromOrigin(
  fieldValue: number,
  origin: number,
  offset: number
) {
  return Math.max(0, Math.abs(fieldValue - origin) - offset);
}
