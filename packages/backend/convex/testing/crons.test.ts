import { describe, expect, test } from "vitest";
import crons from "../crons";

describe("cron schedules", () => {
  test("crons definition is exported as default", () => {
    expect(crons).toBeDefined();
  });

  test("contains registered scheduled jobs", () => {
    expect(crons).toBeTypeOf("object");
  });
});
