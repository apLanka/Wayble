import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "./accessibility";

/**
 * US-16 — how well a place's recorded attributes meet one user's needs.
 *
 * Pure and `ctx`-free, like `confidence.ts`: the mobile app imports it to rank
 * results on the device, and backend Vitest covers it without a database.
 * Needs and attributes share one vocabulary (US-02 chose attribute keys over
 * coarse categories for exactly this), so a need is matched by key alone.
 *
 * Per need, the place's value decides the bucket and the credit:
 *
 *   yes            → met            1
 *   partial        → partial        0.5
 *   no             → unmet          0
 *   unknown        → unknown        0
 *   (not reported) → unknown        0
 *   not_applicable → notApplicable  excluded from the score entirely
 *
 * `not_applicable` is left out rather than scored 0: "elevator: not
 * applicable" on a single-storey building is not a miss, and counting it as
 * one would rank a place down for not needing a feature.
 *
 * `score` is the credit over the needs that count, so it is in [0, 1] and
 * comparable between users with different numbers of needs. It is `null` when
 * the user has no needs (nothing to rank by), and 0 when every need is
 * `not_applicable` (nothing here meets one).
 */

export type MatchResult = {
  score: number | null;
  met: AccessibilityAttributeKey[];
  partial: AccessibilityAttributeKey[];
  unmet: AccessibilityAttributeKey[];
  unknown: AccessibilityAttributeKey[];
  notApplicable: AccessibilityAttributeKey[];
};

const PARTIAL_CREDIT = 0.5;

export function matchScore(
  placeAttributes: AccessibilityAttribute[],
  userNeeds: AccessibilityAttributeKey[],
): MatchResult {
  // First value per key. `aggregateAttributes` never yields a key twice, so
  // this only decides anything for a caller passing raw report attributes.
  const values = new Map<AccessibilityAttributeKey, AccessibilityAttribute>();
  for (const attribute of placeAttributes) {
    if (!values.has(attribute.key)) values.set(attribute.key, attribute);
  }

  const result: MatchResult = {
    score: null,
    met: [],
    partial: [],
    unmet: [],
    unknown: [],
    notApplicable: [],
  };

  // `updateProfile` rejects duplicate needs, but a duplicate here would count
  // one need twice, so they are dropped again rather than trusted away.
  const needs = [...new Set(userNeeds)];
  for (const need of needs) {
    switch (values.get(need)?.value) {
      case "yes":
        result.met.push(need);
        break;
      case "partial":
        result.partial.push(need);
        break;
      case "no":
        result.unmet.push(need);
        break;
      case "not_applicable":
        result.notApplicable.push(need);
        break;
      case "unknown":
      case undefined:
        result.unknown.push(need);
        break;
    }
  }

  if (needs.length === 0) return result;

  const counted = needs.length - result.notApplicable.length;
  result.score =
    counted === 0
      ? 0
      : (result.met.length + PARTIAL_CREDIT * result.partial.length) / counted;
  return result;
}
