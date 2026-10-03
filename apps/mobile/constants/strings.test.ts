import { describe, expect, it } from "vitest";

import { plural, STRINGS } from "./strings";

/**
 * The composed parts of `STRINGS` are where a refactor can do real damage.
 *
 * A label assembled from a name, a distance and a note is a sentence, and a
 * sentence loses its meaning if a comma or a joining word goes missing in
 * transit. Screen-reader users hear these strings read aloud; sighted users
 * with low vision read them slowly. Both are the app's primary audience, which
 * is why the exact output is asserted here rather than left to review.
 *
 * Each task that adds a composed label adds a `describe` block for it, with
 * the two cases that matter most: the clause present, and the clause absent.
 * The absent case is the one a mechanical extraction gets wrong, because
 * `name, , 450m away` still type-checks and still renders.
 */

describe("plural", () => {
  it("picks the singular for exactly 1", () => {
    expect(plural(1, "need", "needs")).toBe("need");
  });

  it("picks the plural for 0 — English treats zero as plural", () => {
    expect(plural(0, "need", "needs")).toBe("needs");
  });

  it("picks the plural for 2 and above", () => {
    expect(plural(2, "need", "needs")).toBe("needs");
    expect(plural(7, "need", "needs")).toBe("needs");
  });
});

describe("STRINGS.common.countLabel", () => {
  it("reads '1 need'", () => {
    expect(STRINGS.common.countLabel(1, "need")).toBe("1 need");
  });

  it("reads '0 needs' and '3 needs'", () => {
    expect(STRINGS.common.countLabel(0, "need")).toBe("0 needs");
    expect(STRINGS.common.countLabel(3, "need")).toBe("3 needs");
  });
});

describe("STRINGS.profile", () => {
  it("navRowLabel joins title and subtitle with a full stop", () => {
    expect(
      STRINGS.profile.navRowLabel("Reports", "For places you follow"),
    ).toBe("Reports. For places you follow");
  });

  // The absent-clause case. "Sign Out. " type-checks and renders, and only
  // fails when a screen reader reads it aloud.
  it("navRowLabel returns the title alone when there is no subtitle", () => {
    expect(STRINGS.profile.navRowLabel("Sign Out", null)).toBe("Sign Out");
  });

  it("profilePhotoLabel names the person", () => {
    expect(STRINGS.profile.profilePhotoLabel("Nimal")).toBe(
      "Profile photo for Nimal",
    );
  });

  it("profilePhotoLabel falls back to the default avatar", () => {
    expect(STRINGS.profile.profilePhotoLabel(null)).toBe(
      "Default profile avatar",
    );
  });

  // Pinned to the exact sentences utils/get-accessibility-needs-summary.ts
  // returns, because that function now delegates here. Nothing else pins
  // them: there is no test file for that util.
  it("needsCountLabel matches the util it replaced", () => {
    expect(STRINGS.profile.needsCountLabel(0)).toBe("0 needs selected");
    expect(STRINGS.profile.needsCountLabel(1)).toBe("1 need selected");
    expect(STRINGS.profile.needsCountLabel(2)).toBe("2 needs selected");
  });

  it("needsCategoryHint says which way the tap goes", () => {
    expect(STRINGS.profile.needsCategoryHint("Mobility", true)).toBe(
      "Mobility need. Double tap to remove from your accessibility needs.",
    );
    expect(STRINGS.profile.needsCategoryHint("Mobility", false)).toBe(
      "Mobility need. Double tap to add to your accessibility needs.",
    );
  });

  it("needsCategoryCount is a suffix, and is only used when positive", () => {
    expect(STRINGS.profile.needsCategoryCount(3)).toBe(" · 3 selected");
  });
});

describe("STRINGS.report", () => {
  it("stepOf states the position and the total", () => {
    expect(STRINGS.report.stepOf(2, 4)).toBe("Step 2 of 4");
  });

  // The em dash is a real character. Swapping it for a hyphen type-checks,
  // renders, and is invisible until someone diffs the two.
  it("stepOfWithTitle joins with an em dash, not a hyphen", () => {
    expect(STRINGS.report.stepOfWithTitle(2, 4, "Attributes")).toBe(
      "Step 2 of 4 — Attributes",
    );
  });

  it("continueToLabel names the step it advances to", () => {
    expect(STRINGS.report.continueToLabel("Attributes")).toBe(
      "Continue to Attributes",
    );
  });

  it("stepTitles covers every ReportStep", () => {
    expect(Object.keys(STRINGS.report.stepTitles).sort()).toEqual([
      "attributes",
      "category",
      "confirm",
      "notes",
    ]);
  });

  it("notes.summaryHint names the character cap", () => {
    expect(STRINGS.report.notes.summaryHint(280)).toBe(
      "Optional. Up to 280 characters.",
    );
  });

  it("notes.charactersLeft counts down from the cap", () => {
    expect(STRINGS.report.notes.charactersLeft(12, 280)).toBe(
      "12 of 280 characters left",
    );
  });

  it("category.hint names the count, then what tapping does", () => {
    expect(STRINGS.report.category.hint("3 attributes", "Mobility")).toBe(
      "3 attributes. Opens the mobility attributes to report on.",
    );
  });

  it("attributes.valueAnnounce reads the value being set", () => {
    expect(STRINGS.report.attributes.valueAnnounce("Ramp", "Available")).toBe(
      "Ramp: Available",
    );
  });

  it("confirm.summaryLabel names the note it speaks", () => {
    expect(STRINGS.report.confirm.summaryLabel("Side entrance only")).toBe(
      "Your note: Side entrance only",
    );
  });

  // The most grammar-heavy function in the module: a list join, two plural
  // forms and a pronoun switch, all spoken aloud. Ruling 14 moved the English
  // joining here, so it is pinned here.
  describe("attributes.outstandingNote", () => {
    it("returns empty for a count of zero rather than saying 'undefined'", () => {
      expect(STRINGS.report.attributes.outstandingNote(0, [])).toBe("");
    });

    it("uses the singular noun and 'it' for one attribute", () => {
      expect(STRINGS.report.attributes.outstandingNote(1, ["Mobility"])).toBe(
        "A note is still required for 1 attribute in Mobility. Go back and choose Mobility to add it.",
      );
    });

    it("pluralises the noun and the pronoun for more than one", () => {
      expect(
        STRINGS.report.attributes.outstandingNote(3, ["Mobility", "Vision"]),
      ).toBe(
        "A note is still required for 3 attributes in Mobility and Vision. Go back and choose Mobility and Vision to add them.",
      );
    });

    // Three groups is where a naive join produces "A, B and " with nothing
    // after it; two groups is where it produces "A,  and B".
    it("joins three groups with commas and a final 'and'", () => {
      expect(
        STRINGS.report.attributes.outstandingNote(4, [
          "Mobility",
          "Vision",
          "Hearing",
        ]),
      ).toContain("in Mobility, Vision and Hearing.");
    });
  });
});

describe("STRINGS.place", () => {
  // AttributeRow and ReportCard build the same sentence from the same parts —
  // the latter pre-appends ". Note: " and passes it whole. One function serves
  // both, because two would drift the first time either was reworded.
  it("attributeLabel omits the note clause when there is no note", () => {
    expect(STRINGS.place.attributeLabel("Ramp", "Available", null)).toBe(
      "Ramp: Available",
    );
  });

  it("attributeLabel appends the note after a full stop", () => {
    expect(STRINGS.place.attributeLabel("Ramp", "Partial", "Slight lip")).toBe(
      "Ramp: Partial. Note: Slight lip",
    );
  });

  it("ownReportNote names the restriction, then the tally", () => {
    expect(STRINGS.place.ownReportNote("2 confirmed")).toBe(
      "You can't verify your own report · 2 confirmed",
    );
  });

  it("reportedOn prefixes the observation time", () => {
    expect(STRINGS.place.reportedOn("2 days ago")).toBe("Reported 2 days ago");
  });
});

describe("STRINGS.map", () => {
  it("placeRowLabel keeps the comma and the word 'away'", () => {
    expect(STRINGS.map.placeRowLabel("Cafe", "food_and_drink", "450m")).toBe(
      "Cafe, food_and_drink, 450m away",
    );
  });

  // The absent-clause case. `name, , 450m away` type-checks and still renders,
  // so it only fails when someone reads it aloud.
  it("placeRowLabel drops the distance clause entirely when there is none", () => {
    expect(STRINGS.map.placeRowLabel("Cafe", "food_and_drink", null)).toBe(
      "Cafe, food_and_drink",
    );
  });

  it("searchResultLabel omits absent clauses without a dangling comma", () => {
    expect(STRINGS.map.searchResultLabel("Cafe", "450m", null)).toBe(
      "Cafe, 450m",
    );
    expect(STRINGS.map.searchResultLabel("Cafe", null, "ramp, lift")).toBe(
      "Cafe, features: ramp, lift",
    );
    expect(STRINGS.map.searchResultLabel("Cafe", null, null)).toBe("Cafe");
  });

  it("categoryLabel prefixes the category", () => {
    expect(STRINGS.map.categoryLabel("Retail")).toBe("Category: Retail");
  });

  // Both map surfaces resolve a known category to its label and fall back to
  // composing from the raw key. The known branch deliberately does NOT append
  // " accessible" — that is the existing behaviour, kept verbatim.
  it("categoryAccessible prefers the known label", () => {
    expect(STRINGS.map.categoryAccessible("ramp", "Ramp")).toBe("Ramp");
  });

  it("categoryAccessible composes from the raw key when unknown", () => {
    expect(STRINGS.map.categoryAccessible("ramp", null)).toBe(
      "ramp accessible",
    );
  });

  it("placeMarker names the all-category pin, not the category", () => {
    expect(STRINGS.map.placeMarker("all", "All places")).toBe("Place marker");
  });

  it("placeMarker names the category otherwise", () => {
    expect(STRINGS.map.placeMarker("wheelchair", "Wheelchair Accessible")).toBe(
      "Wheelchair Accessible place",
    );
  });
});

describe("STRINGS.home.profileGreeting", () => {
  it("joins the greeting and the name with a comma", () => {
    expect(STRINGS.home.profileGreeting("Good morning", "Nimal")).toBe(
      "Good morning, Nimal",
    );
  });

  // The absent-name path. A signed-out visitor has no display name, and this
  // branch replaces the whole sentence rather than omitting a clause — a
  // mechanical extraction that interpolated anyway would greet nobody.
  it("welcomes a signed-out visitor instead of trailing a comma", () => {
    expect(STRINGS.home.profileGreeting("Good morning", null)).toBe(
      "Welcome to Wayble",
    );
  });
});
