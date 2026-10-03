import { STRINGS } from "@/constants/strings";

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return STRINGS.common.distanceMetres(meters);
  }
  const km = meters / 1000;
  return STRINGS.common.distanceKilometres(km);
}
