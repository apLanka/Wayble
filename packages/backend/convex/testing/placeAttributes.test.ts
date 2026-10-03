import { describe, expect, test } from "vitest";
import { aggregateAttributes } from "../placeAttributes";

describe("aggregateAttributes", () => {
  test("returns nothing for no reports", () => {
    expect(aggregateAttributes([])).toEqual([]);
  });

  test("keeps the newest value per key across reports", () => {
    const result = aggregateAttributes([
      {
        status: "active",
        observedAt: 100,
        attributes: [
          { key: "mobility.elevator", value: "no" },
          { key: "mobility.wide_entrance", value: "yes" },
        ],
      },
      {
        status: "active",
        observedAt: 200,
        attributes: [{ key: "mobility.elevator", value: "yes", note: "Fixed" }],
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      key: "mobility.elevator",
      value: "yes",
      note: "Fixed",
    });
    expect(result).toContainEqual({
      key: "mobility.wide_entrance",
      value: "yes",
    });
  });

  test("does not depend on report order", () => {
    const older = {
      status: "active",
      observedAt: 100,
      attributes: [{ key: "mobility.elevator" as const, value: "no" as const }],
    };
    const newer = {
      status: "active",
      observedAt: 200,
      attributes: [
        { key: "mobility.elevator" as const, value: "yes" as const },
      ],
    };

    expect(aggregateAttributes([newer, older])).toEqual([
      { key: "mobility.elevator", value: "yes" },
    ]);
  });

  test("ignores reports that are not active", () => {
    const result = aggregateAttributes([
      {
        status: "active",
        observedAt: 100,
        attributes: [{ key: "mobility.elevator", value: "no" }],
      },
      {
        status: "superseded",
        observedAt: 300,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
      },
      {
        status: "removed",
        observedAt: 400,
        attributes: [{ key: "vision.braille_signage", value: "yes" }],
      },
    ]);

    expect(result).toEqual([{ key: "mobility.elevator", value: "no" }]);
  });

  test("on an observedAt tie, the first report seen keeps the key", () => {
    const result = aggregateAttributes([
      {
        status: "active",
        observedAt: 100,
        attributes: [{ key: "mobility.elevator", value: "partial" }],
      },
      {
        status: "active",
        observedAt: 100,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
      },
    ]);

    expect(result).toEqual([{ key: "mobility.elevator", value: "partial" }]);
  });
});
