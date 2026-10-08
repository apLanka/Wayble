import { STRINGS } from "@/constants/strings";

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return STRINGS.common.greetingMorning;
  if (hour < 17) return STRINGS.common.greetingAfternoon;
  return STRINGS.common.greetingEvening;
}
