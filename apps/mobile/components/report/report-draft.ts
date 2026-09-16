import {
  ACCESSIBILITY_ATTRIBUTE_KEYS,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
  type AccessibilityAttributeValue,
} from "@packages/backend/convex/accessibility";

/**
 * US-08 — pure state for the four-step report wizard.
 *
 * Deliberately free of React so the reducer and the selectors can be tested
 * with Vitest alone; `apps/mobile` has no component renderer, so anything
 * coupled to React here would ship untested.
 */

export const REPORT_STEPS = [
  "category",
  "attributes",
  "notes",
  "confirm",
] as const;

/** Presentation order for the value picker in step two. */
export const REPORT_ATTRIBUTE_VALUES = [
  "yes",
  "no",
  "partial",
  "unknown",
  "not_applicable",
] as const satisfies readonly AccessibilityAttributeValue[];

export type ReportStep = (typeof REPORT_STEPS)[number];

export type ReportDraft = {
  /** Zero-based index into REPORT_STEPS. */
  step: number;
  category: string | null;
  selected: Partial<
    Record<AccessibilityAttributeKey, AccessibilityAttributeValue>
  >;
  notes: Partial<Record<AccessibilityAttributeKey, string>>;
  summary: string;
};

export type DraftAction =
  | { type: "chooseCategory"; category: string }
  | {
      type: "setValue";
      key: AccessibilityAttributeKey;
      value: AccessibilityAttributeValue;
    }
  | { type: "clearValue"; key: AccessibilityAttributeKey }
  | { type: "setNote"; key: AccessibilityAttributeKey; note: string }
  | { type: "setSummary"; summary: string }
  | { type: "goToStep"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "reset" };

export const emptyDraft: ReportDraft = {
  step: 0,
  category: null,
  selected: {},
  notes: {},
  summary: "",
};

const LAST_STEP = REPORT_STEPS.length - 1;

function clampStep(step: number): number {
  if (step < 0) return 0;
  if (step > LAST_STEP) return LAST_STEP;
  return step;
}

export function reportReducer(
  state: ReportDraft,
  action: DraftAction,
): ReportDraft {
  switch (action.type) {
    case "chooseCategory":
      return { ...state, category: action.category };
    case "setValue": {
      // Changing a value invalidates any note explaining the old one, so
      // drop it rather than leaving a stale explanation attached.
      const notes = { ...state.notes };
      delete notes[action.key];
      return {
        ...state,
        selected: { ...state.selected, [action.key]: action.value },
        notes,
      };
    }
    case "clearValue": {
      const selected = { ...state.selected };
      const notes = { ...state.notes };
      delete selected[action.key];
      delete notes[action.key];
      return { ...state, selected, notes };
    }
    case "setNote":
      return {
        ...state,
        notes: { ...state.notes, [action.key]: action.note },
      };
    case "setSummary":
      // Stored verbatim, NOT trimmed. This feeds a controlled TextInput, so
      // trimming on every keystroke would strip a space the moment it was
      // typed and the user could never enter two words. Trimming happens
      // once, at submit.
      return { ...state, summary: action.summary };
    case "goToStep":
      return { ...state, step: clampStep(action.step) };
    case "next":
      return { ...state, step: clampStep(state.step + 1) };
    case "back":
      return { ...state, step: clampStep(state.step - 1) };
    case "reset":
      // A fresh object rather than the `emptyDraft` singleton: the
      // singleton's `selected` and `notes` are module state, and one stray
      // write by a consumer would corrupt every later reset for the life of
      // the process.
      // A fresh object rather than the `emptyDraft` singleton: the
      // singleton's `selected` and `notes` are module state, and one stray
      // write by a consumer would corrupt every later reset for the life of
      // the process.
      return { ...emptyDraft, selected: {}, notes: {} };
  }
}

/**
 * The attributes to submit, in taxonomy order so the stored report and the
 * confirmation recap agree regardless of the order the user tapped.
 */
export function selectedAttributes(
  draft: ReportDraft,
): AccessibilityAttribute[] {
  const out: AccessibilityAttribute[] = [];
  for (const key of ACCESSIBILITY_ATTRIBUTE_KEYS) {
    const value = draft.selected[key];
    if (value === undefined) continue;
    const note = draft.notes[key]?.trim();
    out.push(note ? { key, value, note } : { key, value });
  }
  return out;
}

/**
 * Attributes set to `partial` that still need an explanation. `S0-5`
 * requires a note for `partial` because "partial" on its own tells the next
 * visitor nothing about whether it works for them.
 */
export function missingRequiredNotes(
  draft: ReportDraft,
): AccessibilityAttributeKey[] {
  return ACCESSIBILITY_ATTRIBUTE_KEYS.filter((key) => {
    if (draft.selected[key] !== "partial") return false;
    return !draft.notes[key]?.trim();
  });
}

/** Whether the wizard's Next button should be enabled on the current step. */
export function canAdvance(draft: ReportDraft): boolean {
  if (draft.step === 0) return draft.category !== null;
  if (draft.step === 1) {
    return (
      Object.keys(draft.selected).length > 0 &&
      missingRequiredNotes(draft).length === 0
    );
  }
  if (draft.step === 2) return true;
  return false;
}
