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
