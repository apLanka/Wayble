import { describe, expect, test } from "vitest";
import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "@packages/backend/convex/accessibility";
import { matchScore } from "@packages/backend/convex/matchScore";
import { matchExplanation, rankPlaces } from "./rank-places";

const ENTRANCE: AccessibilityAttributeKey = "mobility.step_free_entrance";
const ELEVATOR: AccessibilityAttributeKey = "mobility.elevator";
const LOOP: AccessibilityAttributeKey = "hearing.hearing_loop";

function place(
  name: string,
  distance: number | undefined,
  attributes: AccessibilityAttribute[],
) {
  return { name, distance, attributes };
}

const names = (places: { name: string }[]) => places.map((p) => p.name);

describe("rankPlaces", () => {
  test("a better match outranks a nearer place", () => {
    const ranked = rankPlaces(
      [
        place("Near, no match", 50, [{ key: ENTRANCE, value: "no" }]),
        place("Far, full match", 5000, [{ key: ENTRANCE, value: "yes" }]),
      ],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Far, full match", "Near, no match"]);
  });

  test("partial ranks between yes and no", () => {
    const ranked = rankPlaces(
      [
        place("No", 10, [{ key: ENTRANCE, value: "no" }]),
        place("Partial", 20, [
          { key: ENTRANCE, value: "partial", note: "Side door" },
        ]),
        place("Yes", 30, [{ key: ENTRANCE, value: "yes" }]),
      ],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Yes", "Partial", "No"]);
  });

  test("at equal score, a known 'no' ranks below 'no information'", () => {
    // Both score 0. The nearer one has an explicit no, so it must not win on
    // distance alone.
    const ranked = rankPlaces(
      [
        place("Known no", 10, [{ key: ENTRANCE, value: "no" }]),
        place("Unknown", 900, []),
      ],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Unknown", "Known no"]);
  });

  test("at equal score and 'no' count, the nearer place is first", () => {
    const ranked = rankPlaces(
      [
        place("Far", 900, [{ key: ENTRANCE, value: "yes" }]),
        place("Near", 100, [{ key: ENTRANCE, value: "yes" }]),
      ],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Near", "Far"]);
  });

  test("a place without a distance goes after one with", () => {
    const ranked = rankPlaces(
      [
        place("No distance", undefined, [{ key: ENTRANCE, value: "yes" }]),
        place("Has distance", 9999, [{ key: ENTRANCE, value: "yes" }]),
      ],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Has distance", "No distance"]);
  });

  test("full ties fall back to name, so the order is stable", () => {
    const ranked = rankPlaces(
      [place("Beta", undefined, []), place("Alpha", undefined, [])],
      [ENTRANCE],
    );
    expect(names(ranked)).toEqual(["Alpha", "Beta"]);
  });

  test("keeps the input order and attaches no match without needs", () => {
    const input = [
      place("Second by distance", 200, [{ key: ENTRANCE, value: "yes" }]),
      place("First by distance", 100, []),
    ];
    for (const needs of [[], undefined, null]) {
      const ranked = rankPlaces(input, needs);
      expect(names(ranked)).toEqual(names(input));
      expect(ranked.every((p) => p.match === null)).toBe(true);
    }
  });

  test("keeps every field of the input place", () => {
    const [ranked] = rankPlaces(
      [{ ...place("Library", 10, []), _id: "p1", category: "education" }],
      [ENTRANCE],
    );
    expect(ranked?._id).toBe("p1");
    expect(ranked?.category).toBe("education");
    expect(ranked?.match?.unknown).toEqual([ENTRANCE]);
  });

  test("does not mutate the input array", () => {
    const input = [
      place("B", 2, []),
      place("A", 1, [{ key: ENTRANCE, value: "yes" }]),
    ];
    rankPlaces(input, [ENTRANCE]);
    expect(names(input)).toEqual(["B", "A"]);
  });
});

describe("matchExplanation", () => {
  const explain = (
    attributes: AccessibilityAttribute[],
    needs: AccessibilityAttributeKey[],
  ) => matchExplanation(matchScore(attributes, needs));

  test("is null without needs", () => {
    expect(matchExplanation(null)).toBeNull();
    expect(explain([{ key: ENTRANCE, value: "yes" }], [])).toBeNull();
  });

  test("one need met", () => {
    expect(explain([{ key: ENTRANCE, value: "yes" }], [ENTRANCE])).toEqual({
      short: "Meets your need",
      accessibilityLabel: "Ranked by your needs. Meets: Step-free Entrance.",
    });
  });

  test("every need met", () => {
    const result = explain(
      [
        { key: ENTRANCE, value: "yes" },
        { key: ELEVATOR, value: "yes" },
      ],
      [ENTRANCE, ELEVATOR],
    );
    expect(result?.short).toBe("Meets all 2 needs");
  });

  test("some met, one partly, one missing by name", () => {
    const result = explain(
      [
        { key: ENTRANCE, value: "yes" },
        { key: ELEVATOR, value: "partial", note: "Goods lift only" },
        { key: LOOP, value: "no" },
      ],
      [ENTRANCE, ELEVATOR, LOOP],
    );
    expect(result?.short).toBe("1 of 3 needs met, 1 partly · No Hearing Loop");
    expect(result?.accessibilityLabel).toBe(
      "Ranked by your needs. Meets: Step-free Entrance. Partly meets: Elevator. Does not have: Hearing Loop.",
    );
  });

  test("several missing are counted, not listed, on the chip", () => {
    const result = explain(
      [
        { key: ENTRANCE, value: "no" },
        { key: ELEVATOR, value: "no" },
      ],
      [ENTRANCE, ELEVATOR],
    );
    expect(result?.short).toBe("0 of 2 needs met · 2 missing");
    expect(result?.accessibilityLabel).toContain(
      "Does not have: Step-free Entrance, Elevator.",
    );
  });

  test("no information on any need", () => {
    const result = explain([], [ENTRANCE, ELEVATOR]);
    expect(result).toEqual({
      short: "No info on your needs",
      accessibilityLabel:
        "Ranked by your needs. No information on: Step-free Entrance, Elevator.",
    });
  });

  test("an 'unknown' value reads the same as no report", () => {
    expect(explain([{ key: ENTRANCE, value: "unknown" }], [ENTRANCE])).toEqual(
      explain([], [ENTRANCE]),
    );
  });

  test("not-applicable needs are left out of the count but named", () => {
    const result = explain(
      [
        { key: ENTRANCE, value: "yes" },
        { key: ELEVATOR, value: "not_applicable" },
      ],
      [ENTRANCE, ELEVATOR],
    );
    expect(result?.short).toBe("Meets your need");
    expect(result?.accessibilityLabel).toBe(
      "Ranked by your needs. Meets: Step-free Entrance. Not applicable here: Elevator.",
    );
  });

  test("every need not applicable", () => {
    const result = explain(
      [{ key: ELEVATOR, value: "not_applicable" }],
      [ELEVATOR],
    );
    expect(result?.short).toBe("Your needs don't apply here");
  });

  test("partial without any full match", () => {
    const result = explain(
      [{ key: ENTRANCE, value: "partial", note: "Side door" }],
      [ENTRANCE, ELEVATOR],
    );
    expect(result?.short).toBe("0 of 2 needs met, 1 partly");
  });
});
