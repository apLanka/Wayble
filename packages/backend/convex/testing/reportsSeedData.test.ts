import { describe, expect, test } from "vitest";
import { ACCESSIBILITY_ATTRIBUTE_KEYS } from "../accessibility";
import { MAX_NOTE_LENGTH, MAX_OBSERVATION_AGE_MS } from "../reportLimits";
import { SEED_PLACES } from "../seed/placesSeedData";
import {
  MAX_AGE_DAYS,
  MIN_AGE_DAYS,
  SEED_REPORT_SUMMARY,
  seedReportsFor,
} from "../seed/reportsSeedData";

const NOW = 1_790_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

const generated = SEED_PLACES.map((place) => ({
  place,
  reports: seedReportsFor(place, NOW),
}));
const allReports = generated.flatMap((g) => g.reports);
const allAttributes = allReports.flatMap((r) => r.attributes);

describe("seedReportsFor", () => {
  test("is deterministic for the same place", () => {
    for (const place of SEED_PLACES.slice(0, 20)) {
      expect(seedReportsFor(place, NOW)).toEqual(seedReportsFor(place, NOW));
    }
  });

  test("leaves a realistic share of places with no reports", () => {
    const empty = generated.filter((g) => g.reports.length === 0).length;
    const share = empty / SEED_PLACES.length;
    // Target 30%. Bounded rather than exact so a dataset edit does not break
    // it, but tight enough that "nobody" or "everybody" fails.
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.45);
  });

  test("gives some places a newer report that overrides an older one", () => {
    const pairs = generated.filter((g) => g.reports.length === 2);
    expect(pairs.length).toBeGreaterThan(5);
    for (const { reports } of pairs) {
      const [newer, older] = reports;
      expect(newer!.observedAt).toBeGreaterThan(older!.observedAt);
      const olderKeys = new Set(older!.attributes.map((a) => a.key));
      for (const attribute of newer!.attributes) {
        expect(olderKeys.has(attribute.key)).toBe(true);
      }
    }
  });

  test("never gives a place more than two reports", () => {
    for (const { reports } of generated) {
      expect(reports.length).toBeLessThanOrEqual(2);
    }
  });

  test("uses every attribute value somewhere", () => {
    const values = new Set(allAttributes.map((a) => a.value));
    expect([...values].sort()).toEqual([
      "no",
      "not_applicable",
      "partial",
      "unknown",
      "yes",
    ]);
  });

  test("only uses taxonomy keys, never twice in one report", () => {
    const known = new Set<string>(ACCESSIBILITY_ATTRIBUTE_KEYS);
    for (const report of allReports) {
      const keys = report.attributes.map((a) => a.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of keys) expect(known.has(key)).toBe(true);
    }
  });

  test("gives every first report between three and seven attributes", () => {
    for (const { reports } of generated) {
      const oldest = reports[reports.length - 1];
      if (!oldest) continue;
      expect(oldest.attributes.length).toBeGreaterThanOrEqual(3);
      expect(oldest.attributes.length).toBeLessThanOrEqual(7);
    }
  });

  test("attaches a note to every partial, within the note limit", () => {
    for (const attribute of allAttributes) {
      if (attribute.value === "partial") {
        expect(attribute.note?.trim().length ?? 0).toBeGreaterThan(0);
      }
      if (attribute.note !== undefined) {
        expect(attribute.note.length).toBeLessThanOrEqual(MAX_NOTE_LENGTH);
      }
    }
  });

  test("dates every report within the age band the server would accept", () => {
    for (const report of allReports) {
      const ageDays = (NOW - report.observedAt) / DAY_MS;
      expect(ageDays).toBeGreaterThanOrEqual(MIN_AGE_DAYS);
      expect(ageDays).toBeLessThanOrEqual(MAX_AGE_DAYS);
      expect(NOW - report.observedAt).toBeLessThan(MAX_OBSERVATION_AGE_MS);
    }
  });

  test("labels every report as sample data", () => {
    for (const report of allReports) {
      expect(report.summary.startsWith(SEED_REPORT_SUMMARY)).toBe(true);
      expect(report.summary).not.toMatch(/verified/i);
    }
  });
});
