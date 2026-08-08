import { describe, expect, test } from "vitest";
import { ACCESSIBILITY_ATTRIBUTE_KEYS } from "./accessibility";
import {
  buildVerifyNearbyPush,
  PUSH_ATTRIBUTE_LABELS,
} from "./notificationCopy";

describe("PUSH_ATTRIBUTE_LABELS", () => {
  test("covers every attribute key in the taxonomy", () => {
    const missing = ACCESSIBILITY_ATTRIBUTE_KEYS.filter(
      (key) => !PUSH_ATTRIBUTE_LABELS[key],
    );
    expect(missing).toEqual([]);
  });

  test("never leaks a raw dotted key as a label", () => {
    for (const label of Object.values(PUSH_ATTRIBUTE_LABELS)) {
      expect(label).not.toMatch(/\./);
    }
  });
});

describe("buildVerifyNearbyPush", () => {
  test("names the attribute when one was targeted", () => {
    const { title, body } = buildVerifyNearbyPush({
      placeName: "Central Library",
      need: { needed: true, reason: "never_reported", ageDays: null },
      attributeKey: "mobility.step_free_entrance",
    });
    expect(title).toBe("Central Library needs a check");
    expect(body).toContain("step-free entrance");
    expect(body).toContain("Central Library");
    expect(body).not.toContain("mobility.");
  });

  test("uses generic copy when no attribute was targeted", () => {
    const { body } = buildVerifyNearbyPush({
      placeName: "Central Library",
      need: { needed: true, reason: "never_reported", ageDays: null },
    });
    expect(body).toContain("no accessibility information");
  });

  test("mentions the age of the data when the reason is staleness", () => {
    const { body } = buildVerifyNearbyPush({
      placeName: "Town Hall",
      need: { needed: true, reason: "stale", ageDays: 210 },
    });
    expect(body).toContain("7 months");
  });

  test("says days rather than months for recent staleness", () => {
    const { body } = buildVerifyNearbyPush({
      placeName: "Town Hall",
      need: { needed: true, reason: "stale", ageDays: 20 },
    });
    expect(body).toContain("20 days");
  });

  test("throws if asked for copy about a place needing nothing", () => {
    expect(() =>
      buildVerifyNearbyPush({
        placeName: "Town Hall",
        need: { needed: false },
      }),
    ).toThrow("does not need verification");
  });
});
