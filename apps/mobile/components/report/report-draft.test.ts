import { describe, expect, test } from "vitest";
import {
  canAdvance,
  emptyDraft,
  missingRequiredNotes,
  reportReducer,
  selectedAttributes,
} from "./report-draft";

describe("reportReducer", () => {
  test("chooseCategory sets the group and does not move the step", () => {
    const next = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(next.category).toBe("Mobility");
    expect(next.step).toBe(0);
  });

  test("next advances one step", () => {
    const withCategory = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(reportReducer(withCategory, { type: "next" }).step).toBe(1);
  });

  test("back stops at the first step", () => {
    expect(reportReducer(emptyDraft, { type: "back" }).step).toBe(0);
  });

  test("next stops at the last step", () => {
    const atConfirm = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(reportReducer(atConfirm, { type: "next" }).step).toBe(3);
  });

  test("goToStep clamps below the first step", () => {
    expect(reportReducer(emptyDraft, { type: "goToStep", step: -1 }).step).toBe(
      0,
    );
  });

  test("goToStep clamps above the last step", () => {
    const atFirst = reportReducer(emptyDraft, { type: "goToStep", step: 0 });
    expect(reportReducer(atFirst, { type: "goToStep", step: 99 }).step).toBe(3);
  });

  test("back steps back from the last step", () => {
    const atConfirm = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(reportReducer(atConfirm, { type: "back" }).step).toBe(2);
  });

  test("setValue records a value and clears any stale note", () => {
    const withNote = reportReducer(emptyDraft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Keypad is tall.",
    });
    const next = reportReducer(withNote, {
      type: "setValue",
      key: "mobility.elevator",
      value: "yes",
    });
    expect(next.selected["mobility.elevator"]).toBe("yes");
    expect(next.notes["mobility.elevator"]).toBeUndefined();
  });

  test("clearValue removes both the value and its note", () => {
    const selected = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    const noted = reportReducer(selected, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Keypad is tall.",
    });
    const cleared = reportReducer(noted, {
      type: "clearValue",
      key: "mobility.elevator",
    });
    expect(cleared.selected["mobility.elevator"]).toBeUndefined();
    expect(cleared.notes["mobility.elevator"]).toBeUndefined();
  });

  test("setSummary stores the report summary verbatim", () => {
    // Deliberately NOT trimmed: this value feeds a controlled TextInput, so
    // trimming here would strip a space as soon as it was typed and the user
    // could never enter two words. Trimming belongs at submit, not per keystroke.
    const next = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "  step free entrance  ",
    });
    expect(next.summary).toBe("  step free entrance  ");
  });

  test("setSummary preserves a trailing space so words can be separated", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "hello",
    });
    draft = reportReducer(draft, { type: "setSummary", summary: "hello " });
    expect(draft.summary).toBe("hello ");
  });

  test("reset returns the empty draft", () => {
    const dirty = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "x",
    });
    expect(reportReducer(dirty, { type: "reset" })).toEqual(emptyDraft);
  });

  test("reset does not alias the emptyDraft singleton", () => {
    // `toEqual` above compares the returned object against the very object
    // `reset` returns, so it cannot see aliasing. These identity checks can.
    const dirty = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "x",
    });
    const reset = reportReducer(dirty, { type: "reset" });
    expect(reset.selected).not.toBe(emptyDraft.selected);
    expect(reset.notes).not.toBe(emptyDraft.notes);
  });
});

describe("selectedAttributes", () => {
  test("returns nothing when nothing is selected", () => {
    expect(selectedAttributes(emptyDraft)).toEqual([]);
  });

  test("returns attributes in taxonomy order regardless of selection order", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "vision.braille_signage",
      value: "yes",
    });
    draft = reportReducer(draft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    expect(selectedAttributes(draft).map((a) => a.key)).toEqual([
      "mobility.elevator",
      "vision.braille_signage",
    ]);
  });

  test("omits an empty note rather than storing an empty string", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "   ",
    });
    expect(selectedAttributes(draft)).toEqual([
      { key: "mobility.elevator", value: "no" },
    ]);
  });

  test("includes a non-empty note", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "No elevator at all.",
    });
    expect(selectedAttributes(draft)).toEqual([
      { key: "mobility.elevator", value: "no", note: "No elevator at all." },
    ]);
  });
});

describe("missingRequiredNotes", () => {
  test("is empty when no attribute is partial", () => {
    const draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    expect(missingRequiredNotes(draft)).toEqual([]);
  });

  test("lists a partial attribute with no note", () => {
    const draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    expect(missingRequiredNotes(draft)).toEqual(["mobility.elevator"]);
  });

  test("treats a whitespace-only note as missing", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "   ",
    });
    expect(missingRequiredNotes(draft)).toEqual(["mobility.elevator"]);
  });

  test("is satisfied once the note has content", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Ramp only at the side entrance.",
    });
    expect(missingRequiredNotes(draft)).toEqual([]);
  });
});

describe("canAdvance", () => {
  test("blocks step one until a category is chosen", () => {
    expect(canAdvance(emptyDraft)).toBe(false);
  });

  test("allows step one once a category is chosen", () => {
    const draft = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(canAdvance(draft)).toBe(true);
  });

  test("blocks step two until at least one value is selected", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 1 });
    expect(canAdvance(draft)).toBe(false);
  });

  test("blocks step two while a partial attribute has no note", () => {
    let draft = reportReducer(emptyDraft, { type: "goToStep", step: 1 });
    draft = reportReducer(draft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    expect(canAdvance(draft)).toBe(false);
  });

  test("allows step three unconditionally", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 2 });
    expect(canAdvance(draft)).toBe(true);
  });

  test("blocks the confirm step, which has no next", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(canAdvance(draft)).toBe(false);
  });
});
