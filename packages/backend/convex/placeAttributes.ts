import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "./accessibility";

/**
 * A place's current accessibility attributes, derived from its reports.
 *
 * Pure and `ctx`-free so every reader of a place's attributes applies the same
 * rule: `getPlace` for the detail screen, and `nearest` / `search` for the
 * US-16 ranking. If those disagreed, a place could rank high for an attribute
 * its own detail screen does not show.
 *
 * The rule: active reports only; per key, the value from the report with the
 * greatest `observedAt`. On a tie the first report seen keeps the key, so the
 * result follows the caller's order — `by_place` index order in practice.
 */

export type AttributeSourceReport = {
  status: string;
  observedAt: number;
  attributes: AccessibilityAttribute[];
};

export function aggregateAttributes(
  reports: AttributeSourceReport[],
): AccessibilityAttribute[] {
  const latest = new Map<
    AccessibilityAttributeKey,
    { attribute: AccessibilityAttribute; observedAt: number }
  >();

  for (const report of reports) {
    if (report.status !== "active") continue;
    for (const attribute of report.attributes) {
      const existing = latest.get(attribute.key);
      if (!existing || report.observedAt > existing.observedAt) {
        latest.set(attribute.key, {
          attribute,
          observedAt: report.observedAt,
        });
      }
    }
  }

  return Array.from(latest.values()).map((entry) => entry.attribute);
}
