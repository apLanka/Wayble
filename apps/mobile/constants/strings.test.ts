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
