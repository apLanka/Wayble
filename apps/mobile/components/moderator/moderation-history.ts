/** S4-7b — pure helpers for the moderator dialog and history list. */

export const MAX_MODERATOR_NOTE_LENGTH = 280;

export type ModerationOutcome = "removed" | "dismissed";

export const OUTCOME_LABELS: Record<ModerationOutcome, string> = {
  removed: "Removed",
  dismissed: "Dismissed",
};

/** Trimmed note, or undefined when blank — what the server stores. */
export function normalizeNote(note: string): string | undefined {
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Past decision as one sentence, for the row's single accessibility node. */
export function describeHistoryItem(item: {
  outcome: ModerationOutcome;
  placeName: string;
  flagCount: number;
  resolvedByName: string;
  resolutionNote?: string;
  when: string;
}): string {
  const flags = `${item.flagCount} ${item.flagCount === 1 ? "flag" : "flags"}`;
  const note = item.resolutionNote ? ` Note: ${item.resolutionNote}.` : "";
  return `${OUTCOME_LABELS[item.outcome]} report at ${item.placeName}, ${flags}, by ${item.resolvedByName}, ${item.when}.${note}`;
}
