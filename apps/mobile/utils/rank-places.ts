import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "@packages/backend/convex/accessibility";
import {
  matchScore,
  type MatchResult,
} from "@packages/backend/convex/matchScore";

// Relative, not `@/`: Vitest here has no path-alias config, and this module is
// tested directly.
import { ATTRIBUTE_METADATA } from "../constants/accessibility-metadata";

/**
 * US-16 — order a results list by how well each place meets the user's needs,
 * and say why each one sits where it does.
 *
 * Pure, for Vitest: `apps/mobile` has no component renderer, so the order and
 * the copy are tested here and the row component only displays them.
 */

export type RankablePlace = {
  name: string;
  distance?: number;
  attributes: AccessibilityAttribute[];
};

export type Ranked<T> = T & { match: MatchResult | null };

/**
 * Best match first. The order, each step breaking ties in the one before:
 *
 * 1. `score`, highest first.
 * 2. Fewer explicit "no"s. At the same score, a place known to lack something
 *    you need ranks below one we simply have no information on.
 * 3. `distance`, nearest first; a place with no distance goes last.
 * 4. `name`, so equal places do not swap between renders.
 *
 * With no needs, nothing is re-ordered: the input's order (distance from
 * `nearest`, relevance from `search`) is kept, and every `match` is null.
 */
export function rankPlaces<T extends RankablePlace>(
  places: T[],
  needs: AccessibilityAttributeKey[] | null | undefined,
): Ranked<T>[] {
  if (!needs || needs.length === 0) {
    return places.map((place) => ({ ...place, match: null }));
  }
  return places
    .map((place) => ({ ...place, match: matchScore(place.attributes, needs) }))
    .sort(compareRanked);
}

function compareRanked(
  a: RankablePlace & { match: MatchResult | null },
  b: RankablePlace & { match: MatchResult | null },
): number {
  const byScore = (b.match?.score ?? 0) - (a.match?.score ?? 0);
  if (byScore !== 0) return byScore;

  const byUnmet = (a.match?.unmet.length ?? 0) - (b.match?.unmet.length ?? 0);
  if (byUnmet !== 0) return byUnmet;

  const byDistance =
    (a.distance ?? Number.POSITIVE_INFINITY) -
    (b.distance ?? Number.POSITIVE_INFINITY);
  // Infinity − Infinity is NaN; two places with no distance are a tie here.
  if (byDistance !== 0 && !Number.isNaN(byDistance)) return byDistance;

  return a.name.localeCompare(b.name);
}

export type MatchExplanation = {
  /** A few words for the chip on the row. */
  short: string;
  /** The whole reason, for the row's screen-reader label. */
  accessibilityLabel: string;
};

/**
 * The "why this ranked here" text for one result, or null with no needs.
 *
 * The chip carries the headline: how many needs are met, and the first thing
 * known to be missing, since that is the fact most likely to rule a place
 * out. The accessibility label carries every bucket by name, so a screen
 * reader user gets the full reason rather than a count.
 */
export function matchExplanation(
  match: MatchResult | null,
): MatchExplanation | null {
  if (!match || match.score === null) return null;

  const { met, partial, unmet, unknown, notApplicable } = match;
  const counted = met.length + partial.length + unmet.length + unknown.length;

  return {
    short: shortText(match, counted),
    accessibilityLabel: [
      "Ranked by your needs.",
      sentence("Meets", met),
      sentence("Partly meets", partial),
      sentence("Does not have", unmet),
      sentence("No information on", unknown),
      sentence("Not applicable here", notApplicable),
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function shortText(match: MatchResult, counted: number): string {
  const { met, partial, unmet } = match;

  if (counted === 0) return "Your needs don't apply here";
  if (met.length + partial.length + unmet.length === 0) {
    return "No info on your needs";
  }
  if (met.length === counted) {
    return counted === 1 ? "Meets your need" : `Meets all ${counted} needs`;
  }

  let text = `${met.length} of ${counted} needs met`;
  if (partial.length > 0) text += `, ${partial.length} partly`;
  if (unmet.length === 1) text += ` · No ${label(unmet[0]!)}`;
  else if (unmet.length > 1) text += ` · ${unmet.length} missing`;
  return text;
}

function sentence(lead: string, keys: AccessibilityAttributeKey[]): string {
  if (keys.length === 0) return "";
  return `${lead}: ${keys.map(label).join(", ")}.`;
}

function label(key: AccessibilityAttributeKey): string {
  // A key the metadata lacks would be a taxonomy bump this file predates;
  // fall back to the key's own words rather than print nothing.
  return (
    ATTRIBUTE_METADATA[key]?.label ??
    (key.split(".")[1] ?? key).replace(/_/g, " ")
  );
}
