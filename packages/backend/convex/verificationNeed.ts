import type { AccessibilityAttributeKey } from "./accessibility";

/**
 * Whether a place (or one attribute of it) still needs community verification.
 *
 * Pure and `ctx`-free so it can be unit-tested without a database, and so the
 * rule can be reasoned about on its own. Thresholds are always passed in;
 * nothing here reads a global.
 *
 * This is deliberately the seam US-11 replaces: when confidence scoring
 * lands, the body of these functions changes and every caller — the sweep,
 * the policy, the copy — stays as it is.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type VerificationNeedInput = {
  observedAt: number;
  status: string;
  attributes: { key: AccessibilityAttributeKey }[];
};

export type VerificationNeed =
  | { needed: true; reason: "never_reported" | "stale"; ageDays: number | null }
  | { needed: false };

/** Judges the place as a whole, using its newest active report. */
export function needsVerification(
  reports: VerificationNeedInput[],
  now: number,
  opts: { staleAfterDays: number },
): VerificationNeed {
  const active = reports.filter((r) => r.status === "active");
  return judge(
    active.map((r) => r.observedAt),
    now,
    opts,
  );
}

/** Judges a single attribute, using the newest active report mentioning it. */
export function attributeNeedsVerification(
  reports: VerificationNeedInput[],
  key: AccessibilityAttributeKey,
  now: number,
  opts: { staleAfterDays: number },
): VerificationNeed {
  const observedAts = reports
    .filter(
      (r) => r.status === "active" && r.attributes.some((a) => a.key === key),
    )
    .map((r) => r.observedAt);
  return judge(observedAts, now, opts);
}

function judge(
  observedAts: number[],
  now: number,
  opts: { staleAfterDays: number },
): VerificationNeed {
  if (observedAts.length === 0) {
    return { needed: true, reason: "never_reported", ageDays: null };
  }
  const newest = Math.max(...observedAts);
  const ageDays = Math.floor((now - newest) / DAY_MS);
  if (ageDays > opts.staleAfterDays) {
    return { needed: true, reason: "stale", ageDays };
  }
  return { needed: false };
}
