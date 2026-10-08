import { STRINGS } from "@/constants/strings";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * "3 h ago", falling back to an absolute date past a month.
 *
 * `now` is a parameter rather than an implicit `Date.now()` so the thresholds
 * can be asserted exactly instead of against a moving clock.
 *
 * A verification is only meaningful relative to now — "reported 2 hours ago"
 * is the question a verifier is actually asking — and the pure shape is
 * directly testable, which is what earns it a module of its own.
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE) return STRINGS.common.relativeTime.justNow;

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return STRINGS.common.relativeTime.minutes(minutes);
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return STRINGS.common.relativeTime.hours(hours);
  }

  if (elapsed < WEEK) {
    const days = Math.floor(elapsed / DAY);
    return STRINGS.common.relativeTime.days(days);
  }

  if (elapsed < MONTH) {
    const weeks = Math.floor(elapsed / WEEK);
    return STRINGS.common.relativeTime.weeks(weeks);
  }

  return new Date(timestamp).toLocaleDateString();
}
