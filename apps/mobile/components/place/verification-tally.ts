/**
 * US-10 — pure tally arithmetic for the verify control.
 *
 * Free of React so it can be tested with Vitest alone. `apps/mobile` has no
 * component renderer, so anything coupled to React here would ship untested —
 * the same split `report-draft.ts` uses for the US-08 wizard.
 */

export type Verdict = "confirm" | "dispute";

export type VerificationTally = {
  confirmCount: number;
  disputeCount: number;
  myVerdict: Verdict | null;
};

/** The tally as a single sentence, so a screen reader reads one thing. */
export function tallySummary(tally: VerificationTally): string {
  if (tally.confirmCount === 0 && tally.disputeCount === 0) {
    return "No verifications yet";
  }

  const parts: string[] = [];
  if (tally.confirmCount > 0) {
    parts.push(`${tally.confirmCount} confirmed`);
  }
  if (tally.disputeCount > 0) {
    parts.push(`${tally.disputeCount} disputed`);
  }
  return parts.join(" · ");
}

/**
 * The tally as it will look once `next` is recorded.
 *
 * This is what the optimistic patch applies, so it has to be the same
 * arithmetic the server will do — otherwise the number the user sees and the
 * number that settles disagree for as long as the cache holds.
 *
 * `myVerdict` is read from the tally rather than passed separately, because
 * it *is* the previous verdict of the only user this client can speak for.
 * Other users' votes are never adjusted: only the caller's own row moves.
 */
export function applyVerdictChange(
  tally: VerificationTally,
  next: Verdict,
): VerificationTally {
  const confirmDelta =
    (next === "confirm" ? 1 : 0) - (tally.myVerdict === "confirm" ? 1 : 0);
  const disputeDelta =
    (next === "dispute" ? 1 : 0) - (tally.myVerdict === "dispute" ? 1 : 0);

  return {
    confirmCount: Math.max(0, tally.confirmCount + confirmDelta),
    disputeCount: Math.max(0, tally.disputeCount + disputeDelta),
    myVerdict: next,
  };
}

/**
 * Whether a report is the signed-in user's own.
 *
 * A signed-out caller is never the author as far as this screen is concerned;
 * the server rejects self-verification regardless, and reads the real author
 * from the report document.
 */
export function isOwnReport(
  reportAuthorId: string,
  currentUserId: string | undefined,
): boolean {
  return currentUserId !== undefined && reportAuthorId === currentUserId;
}
