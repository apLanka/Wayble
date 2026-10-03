import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
  AccessibilityAttributeValue,
} from "../accessibility";
import type { SeedPlace } from "./placesSeedData";

/**
 * Sample accessibility reports for the seeded places.
 *
 * Every report this produces is FABRICATED. The place dataset carries no
 * accessibility information, so nothing here is an observation of a real
 * venue. It exists so features that read reports — the place detail screen,
 * confidence (US-11), verify-nearby (US-21) and needs ranking (US-16) — have
 * varied data to work on. The summary says so on every report, so a demo
 * viewer is never told a made-up assessment is verified.
 *
 * The data is varied on purpose: some places have no reports, values span all
 * five states, some places carry a newer report that overrides an older one,
 * and ages run from days to months. A dataset where every place says "yes" to
 * the same eight attributes cannot exercise any of those features.
 *
 * Deterministic: each place's reports are drawn from a PRNG seeded with its
 * name, so a re-seed reproduces the same data and the tests can pin it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const SEED_REPORT_SUMMARY =
  "Sample report generated for demo data, not a real assessment.";

/** Share of places left with no reports at all. */
export const NO_REPORT_SHARE = 0.3;

/** Share of reported places that also get a newer, overriding report. */
export const SECOND_REPORT_SHARE = 0.25;

export const MIN_AGE_DAYS = 3;
export const MAX_AGE_DAYS = 300;

export type SeedReport = {
  attributes: AccessibilityAttribute[];
  summary: string;
  observedAt: number;
};

/** Asked of every place: the basics anyone arriving needs to know. */
const CORE_KEYS: AccessibilityAttributeKey[] = [
  "mobility.step_free_entrance",
  "mobility.wide_entrance",
  "mobility.accessible_restroom",
];

/** What a reporter would plausibly also check at each kind of place. */
const KEYS_BY_CATEGORY: Record<
  SeedPlace["category"],
  AccessibilityAttributeKey[]
> = {
  healthcare: [
    "mobility.elevator",
    "mobility.accessible_parking",
    "mobility.wheelchair_seating",
    "assistance.staff_support",
    "hearing.visual_alarms",
  ],
  transport: [
    "mobility.elevator",
    "vision.tactile_guidance",
    "vision.visual_hazard_marking",
    "sensory.clear_signage",
    "hearing.hearing_loop",
  ],
  education: [
    "mobility.elevator",
    "mobility.step_free_interior",
    "vision.braille_signage",
    "sensory.quiet_space",
    "hearing.hearing_loop",
  ],
  workplace: [
    "mobility.elevator",
    "mobility.step_free_interior",
    "mobility.accessible_parking",
    "hearing.visual_alarms",
  ],
  food_and_drink: [
    "mobility.wheelchair_seating",
    "mobility.step_free_interior",
    "sensory.low_stimulation_option",
    "assistance.service_animals",
  ],
  retail: [
    "mobility.step_free_interior",
    "mobility.accessible_parking",
    "assistance.staff_support",
    "sensory.clear_signage",
  ],
  government: [
    "mobility.elevator",
    "communication.accessible_service_option",
    "vision.braille_signage",
    "mobility.accessible_parking",
  ],
  lodging: [
    "mobility.elevator",
    "mobility.step_free_interior",
    "hearing.visual_alarms",
    "assistance.service_animals",
  ],
  outdoor: [
    "mobility.accessible_parking",
    "vision.tactile_guidance",
    "sensory.quiet_space",
  ],
  other: ["mobility.step_free_interior", "assistance.staff_support"],
};

/** Weighted so most answers are useful, but every state appears. */
const VALUE_WEIGHTS: [AccessibilityAttributeValue, number][] = [
  ["yes", 50],
  ["partial", 20],
  ["no", 20],
  ["unknown", 5],
  ["not_applicable", 5],
];

/**
 * A `partial` always carries a note: S0-5 requires one, because "partial" on
 * its own tells the next visitor nothing. The wizard enforces it for real
 * reports; the seed holds itself to the same rule.
 */
const PARTIAL_NOTES: Record<string, string> = {
  mobility: "Only via the side entrance.",
  vision: "Only on the ground floor.",
  hearing: "Only at the main counter.",
  communication: "Available on request.",
  sensory: "Only outside peak hours.",
  assistance: "Depends on staff on duty.",
};

const SUMMARIES = [
  SEED_REPORT_SUMMARY,
  `${SEED_REPORT_SUMMARY} Visited on a weekday morning.`,
  `${SEED_REPORT_SUMMARY} Checked the main entrance and ground floor.`,
];

/** The newest-first, per-place reports for one seeded place. */
export function seedReportsFor(
  place: Pick<SeedPlace, "name" | "category">,
  now: number,
): SeedReport[] {
  const random = mulberry32(hashString(place.name));

  if (random() < NO_REPORT_SHARE) return [];

  const pool = [...CORE_KEYS, ...(KEYS_BY_CATEGORY[place.category] ?? [])];
  const keyCount = 3 + Math.floor(random() * Math.min(5, pool.length - 2));
  const keys = shuffle(pool, random).slice(0, keyCount);

  const firstAge = randomBetween(random, 60, MAX_AGE_DAYS);
  const first: SeedReport = {
    attributes: keys.map((key) => attribute(key, random)),
    summary: pick(SUMMARIES, random),
    observedAt: now - firstAge * DAY_MS,
  };

  if (random() >= SECOND_REPORT_SHARE) {
    // A single report can be any age, not only the older band above.
    first.observedAt =
      now - randomBetween(random, MIN_AGE_DAYS, MAX_AGE_DAYS) * DAY_MS;
    return [first];
  }

  // A later visit re-checks one or two of the same keys, so a place's current
  // value comes from the newer report and its older answer is overridden.
  const recheckCount = 1 + Math.floor(random() * 2);
  const rechecked = shuffle(keys, random).slice(0, recheckCount);
  const second: SeedReport = {
    attributes: rechecked.map((key) => attribute(key, random)),
    summary: pick(SUMMARIES, random),
    observedAt: now - randomBetween(random, MIN_AGE_DAYS, 59) * DAY_MS,
  };
  return [second, first];
}

function attribute(
  key: AccessibilityAttributeKey,
  random: () => number,
): AccessibilityAttribute {
  const value = weightedPick(VALUE_WEIGHTS, random);
  if (value === "partial") {
    const group = key.split(".")[0] ?? "";
    return { key, value, note: PARTIAL_NOTES[group] ?? "Only in part." };
  }
  return { key, value };
}

function weightedPick<T>(weights: [T, number][], random: () => number): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [value, weight] of weights) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return weights[weights.length - 1]![0];
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

/** Whole days in [min, max]. */
function randomBetween(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Fisher–Yates on a copy; the input is left alone. */
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** FNV-1a, 32-bit. Stable across runs and platforms, unlike Math.random. */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Small seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
