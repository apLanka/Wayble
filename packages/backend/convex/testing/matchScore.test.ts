import { describe, expect, test } from "vitest";
import {
  ACCESSIBILITY_ATTRIBUTE_KEYS,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
  type AccessibilityAttributeValue,
} from "../accessibility";
import { matchScore, type MatchResult } from "../matchScore";

/**
 * Every state one need can be in against a place: the five attribute values,
 * plus "the place has no report for this key at all".
 *
 * The expected bucket and credit are written out here rather than derived
 * from `matchScore`, so these tests are an independent statement of the rule.
 * `credit: null` means the need does not count towards the score.
 */
type State = AccessibilityAttributeValue | "not_reported";

const STATES: {
  state: State;
  bucket: keyof Omit<MatchResult, "score">;
  credit: number | null;
}[] = [
  { state: "yes", bucket: "met", credit: 1 },
  { state: "partial", bucket: "partial", credit: 0.5 },
  { state: "no", bucket: "unmet", credit: 0 },
  { state: "unknown", bucket: "unknown", credit: 0 },
  { state: "not_reported", bucket: "unknown", credit: 0 },
  { state: "not_applicable", bucket: "notApplicable", credit: null },
];

const A: AccessibilityAttributeKey = "mobility.step_free_entrance";
const B: AccessibilityAttributeKey = "mobility.elevator";

function attributeFor(
  key: AccessibilityAttributeKey,
  state: State,
): AccessibilityAttribute[] {
  if (state === "not_reported") return [];
  return state === "partial"
    ? [{ key, value: state, note: "Side door only" }]
    : [{ key, value: state }];
}

/** The score the rule says a set of states should get. */
function expectedScore(credits: (number | null)[]): number {
  const counted = credits.filter((c): c is number => c !== null);
  if (counted.length === 0) return 0;
  return counted.reduce((sum, c) => sum + c, 0) / counted.length;
}

const EMPTY_BUCKETS = {
  met: [],
  partial: [],
  unmet: [],
  unknown: [],
  notApplicable: [],
};

describe("matchScore — one need, every state", () => {
  for (const { state, bucket, credit } of STATES) {
    test(`${state} → ${bucket}, score ${credit ?? 0}`, () => {
      const result = matchScore(attributeFor(A, state), [A]);

      expect(result).toEqual({
        ...EMPTY_BUCKETS,
        [bucket]: [A],
        score: credit ?? 0,
      });
    });
  }
});

describe("matchScore — two needs, every pair of states (6 × 6)", () => {
  for (const first of STATES) {
    for (const second of STATES) {
      test(`${first.state} + ${second.state}`, () => {
        const result = matchScore(
          [...attributeFor(A, first.state), ...attributeFor(B, second.state)],
          [A, B],
        );

        expect(result.score).toBeCloseTo(
          expectedScore([first.credit, second.credit]),
          10,
        );
        // Each need lands in exactly its own bucket, and nowhere else.
        expect(result[first.bucket]).toContain(A);
        expect(result[second.bucket]).toContain(B);
        const placed = [
          ...result.met,
          ...result.partial,
          ...result.unmet,
          ...result.unknown,
          ...result.notApplicable,
        ];
        expect(placed.sort()).toEqual([A, B].sort());
      });
    }
  }
});

describe("matchScore — the score itself", () => {
  test("is null when the user has no needs", () => {
    expect(matchScore([{ key: A, value: "yes" }], [])).toEqual({
      ...EMPTY_BUCKETS,
      score: null,
    });
  });

  test("is 1 for every taxonomy key met on its own", () => {
    // Guards against a key the scorer silently fails to match.
    for (const key of ACCESSIBILITY_ATTRIBUTE_KEYS) {
      const result = matchScore([{ key, value: "yes" }], [key]);
      expect(result.score).toBe(1);
      expect(result.met).toEqual([key]);
    }
  });

  test("is 0 when every need is not applicable", () => {
    const result = matchScore(
      [
        { key: A, value: "not_applicable" },
        { key: B, value: "not_applicable" },
      ],
      [A, B],
    );
    expect(result.score).toBe(0);
    expect(result.notApplicable).toEqual([A, B]);
  });

  test("leaves not-applicable needs out of the denominator", () => {
    // 1 met out of the 1 that counts, not 1 out of 2.
    const result = matchScore(
      [
        { key: A, value: "yes" },
        { key: B, value: "not_applicable" },
      ],
      [A, B],
    );
    expect(result.score).toBe(1);
  });

  test("normalises across different numbers of needs", () => {
    const C: AccessibilityAttributeKey = "hearing.hearing_loop";
    const D: AccessibilityAttributeKey = "vision.braille_signage";
    const two = matchScore([{ key: A, value: "yes" }], [A, B]);
    const four = matchScore(
      [
        { key: A, value: "yes" },
        { key: B, value: "yes" },
      ],
      [A, B, C, D],
    );
    expect(two.score).toBe(0.5);
    expect(four.score).toBe(0.5);
  });

  test("stays within [0, 1] for every triple of states", () => {
    const C: AccessibilityAttributeKey = "hearing.hearing_loop";
    for (const x of STATES) {
      for (const y of STATES) {
        for (const z of STATES) {
          const { score } = matchScore(
            [
              ...attributeFor(A, x.state),
              ...attributeFor(B, y.state),
              ...attributeFor(C, z.state),
            ],
            [A, B, C],
          );
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("matchScore — inputs", () => {
  test("counts a duplicated need once", () => {
    const result = matchScore(
      [
        { key: A, value: "yes" },
        { key: B, value: "no" },
      ],
      [A, A, B],
    );
    expect(result.met).toEqual([A]);
    expect(result.score).toBe(0.5);
  });

  test("ignores place attributes the user does not need", () => {
    const result = matchScore(
      [
        { key: A, value: "yes" },
        { key: B, value: "no" },
      ],
      [A],
    );
    expect(result).toEqual({ ...EMPTY_BUCKETS, met: [A], score: 1 });
  });

  test("lists keys in the order of the user's needs", () => {
    const C: AccessibilityAttributeKey = "hearing.hearing_loop";
    const result = matchScore(
      [
        { key: A, value: "yes" },
        { key: B, value: "yes" },
        { key: C, value: "yes" },
      ],
      [C, A, B],
    );
    expect(result.met).toEqual([C, A, B]);
  });

  test("uses the first value when a key appears twice", () => {
    const result = matchScore(
      [
        { key: A, value: "no" },
        { key: A, value: "yes" },
      ],
      [A],
    );
    expect(result.unmet).toEqual([A]);
  });

  test("a place with no attributes leaves every need unknown", () => {
    const result = matchScore([], [A, B]);
    expect(result).toEqual({ ...EMPTY_BUCKETS, unknown: [A, B], score: 0 });
  });
});
