import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled jobs for nearby-verification notifications.
 *
 * The sweep runs hourly rather than at one fixed time because quiet hours are
 * evaluated per user in their own local time — Convex crons run in UTC, so
 * there is no single hour that is reasonable for everyone. The per-user daily
 * cap, not the cron frequency, is what limits how often anyone is contacted.
 */
const crons = cronJobs();

crons.hourly(
  "verify-nearby-sweep",
  { minuteUTC: 0 },
  internal.notifications.sweep,
  {},
);

crons.interval(
  "verify-nearby-retry-stalled",
  { minutes: 10 },
  internal.notifications.retryStalledDeliveries,
  {},
);

export default crons;
