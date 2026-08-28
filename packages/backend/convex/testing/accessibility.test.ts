import { describe, expect, test } from "vitest";
import {
  ACCESSIBILITY_ATTRIBUTE_KEYS,
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeKeyValidator,
  accessibilityAttributeValidator,
  accessibilityAttributeValueValidator,
} from "../accessibility";

describe("accessibility taxonomy", () => {
  test("taxonomy version is 1", () => {
    expect(ACCESSIBILITY_TAXONOMY_VERSION).toBe(1);
  });

  test("contains exactly 19 predefined attribute keys", () => {
    expect(ACCESSIBILITY_ATTRIBUTE_KEYS).toHaveLength(19);
  });

  test("attribute keys are unique and follow category.name format", () => {
    const set = new Set(ACCESSIBILITY_ATTRIBUTE_KEYS);
    expect(set.size).toBe(ACCESSIBILITY_ATTRIBUTE_KEYS.length);

    for (const key of ACCESSIBILITY_ATTRIBUTE_KEYS) {
      expect(key).toMatch(/^[a-z]+(\.[a-z_]+)+$/);
      expect(key.split(".").length).toBe(2);
    }
  });

  test("covers all required categories: mobility, vision, hearing, communication, sensory, assistance", () => {
    const categories = new Set(
      ACCESSIBILITY_ATTRIBUTE_KEYS.map((k) => k.split(".")[0]),
    );
    expect(Array.from(categories).sort()).toEqual([
      "assistance",
      "communication",
      "hearing",
      "mobility",
      "sensory",
      "vision",
    ]);
  });

  test("validators are defined", () => {
    expect(accessibilityAttributeKeyValidator).toBeDefined();
    expect(accessibilityAttributeValueValidator).toBeDefined();
    expect(accessibilityAttributeValidator).toBeDefined();
  });
});
