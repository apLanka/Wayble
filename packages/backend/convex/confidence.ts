/**
 * Confidence scoring: how much to trust a place's accessibility data.
 *
 * Pure and `ctx`-free, opts-object convention, mirroring `verificationNeed.ts`
 * and `notificationPolicy.ts` — this is the seam `verificationNeed.ts` named
 * as "what US-11 replaces". `staleAfterDays` moves here from `notifications.ts`
 * (canonical home now); `describeAge` moves here from `notificationCopy.ts`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ConfidenceTier = "unverified" | "low" | "medium" | "high";

export type ConfidenceInput = {
  agreeCount: number;
  totalVotes: number;
  distinctVerifiers: number;
  reportAgeDays: number;
};

export type ConfidenceResult = {
  score: number;
  tier: ConfidenceTier;
  isStale: boolean;
};

export type ConfidenceOpts = {
  ageDecayBreakpointsDays: { fresh: number; recent: number };
  tierThresholds: { low: number; medium: number; high: number };
  staleAfterDays: number;
};

export const DEFAULT_CONFIDENCE_OPTS: ConfidenceOpts = {
  ageDecayBreakpointsDays: { fresh: 30, recent: 90 },
  tierThresholds: { low: 0, medium: 1, high: 2 },
  staleAfterDays: 180,
};

/** <fresh days: no decay. <=recent days: mild decay. Older: heavier decay. */
export function computeAgeDecay(
  ageDays: number,
  opts: ConfidenceOpts = DEFAULT_CONFIDENCE_OPTS,
): number {
  const { fresh, recent } = opts.ageDecayBreakpointsDays;
  if (ageDays < fresh) return 1.0;
  if (ageDays <= recent) return 0.8;
  // ponytail: ticket doesn't pin an "old" decay value, only that it's < 0.8.
  return 0.5;
}

/**
 * (agreeCount / totalVotes) * distinctVerifiers * ageDecay — literal formula
 * per this ticket's decision, deliberately unbounded once distinctVerifiers
 * approaches totalVotes. Not normalized on purpose.
 */
export function computeConfidenceScore(
  input: ConfidenceInput,
  opts: ConfidenceOpts = DEFAULT_CONFIDENCE_OPTS,
): number {
  if (input.totalVotes === 0) return 0;
  const decay = computeAgeDecay(input.reportAgeDays, opts);
  return (
    (input.agreeCount / input.totalVotes) * input.distinctVerifiers * decay
  );
}

export function scoreToTier(
  score: number,
  opts: ConfidenceOpts = DEFAULT_CONFIDENCE_OPTS,
): ConfidenceTier {
  const t = opts.tierThresholds;
  if (score >= t.high) return "high";
  if (score >= t.medium) return "medium";
  if (score >= t.low) return "low";
  return "unverified";
}

export function isStale(
  lastVerifiedAt: number | null,
  now: number,
  opts: ConfidenceOpts = DEFAULT_CONFIDENCE_OPTS,
): boolean {
  if (lastVerifiedAt === null) return true;
  const ageDays = Math.floor((now - lastVerifiedAt) / DAY_MS);
  return ageDays > opts.staleAfterDays;
}

export function computeConfidence(
  input: ConfidenceInput & { now: number; lastVerifiedAt: number | null },
  opts: ConfidenceOpts = DEFAULT_CONFIDENCE_OPTS,
): ConfidenceResult {
  const score = computeConfidenceScore(input, opts);
  // score <= 0 means no net agreement signal (no votes, or fully disputed) —
  // unverified regardless of totalVotes, distinct from scoreToTier(0)'s own
  // "low" threshold semantics used when score is genuinely positive.
  const tier = score <= 0 ? "unverified" : scoreToTier(score, opts);
  return {
    score,
    tier,
    isStale: isStale(input.lastVerifiedAt, input.now, opts),
  };
}

/** Days for the first month, whole months after that. */
export function describeAge(ageDays: number): string {
  if (ageDays < 31) {
    return `${ageDays} days`;
  }
  const months = Math.round(ageDays / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}
