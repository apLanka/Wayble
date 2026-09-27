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
 * There is no `formatRelativeTime` in the repo yet — the place screens call
 * `toLocaleDateString` inline — but a verification is only meaningful
 * relative to now ("reported 2 hours ago" is the question a verifier is
 * asking), and the pure shape is directly testable.
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE) return "just now";

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} min ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} h ago`;
  }

  if (elapsed < WEEK) {
    const days = Math.floor(elapsed / DAY);
    return `${days} d ago`;
  }

  if (elapsed < MONTH) {
    const weeks = Math.floor(elapsed / WEEK);
    return `${weeks} w ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}
