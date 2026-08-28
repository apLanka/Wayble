import { describe, expect, test } from "bun:test";
import { parseEnv, resolveConvexUrl, upsertEnvLine } from "./env-file";

describe("parseEnv", () => {
  test("reads simple key=value pairs", () => {
    expect(parseEnv("A=1\nB=2")).toEqual({ A: "1", B: "2" });
  });

  test("ignores comments and blank lines", () => {
    expect(parseEnv("# note\n\nA=1\n")).toEqual({ A: "1" });
  });

  test("strips surrounding quotes", () => {
    expect(parseEnv("A=\"hello\"\nB='world'")).toEqual({
      A: "hello",
      B: "world",
    });
  });

  test("keeps equals signs inside the value", () => {
    expect(parseEnv("URL=https://x.dev/?a=b")).toEqual({
      URL: "https://x.dev/?a=b",
    });
  });

  test("returns an empty object for empty input", () => {
    expect(parseEnv("")).toEqual({});
  });
});

describe("upsertEnvLine", () => {
  test("appends the key when the file is empty", () => {
    expect(upsertEnvLine("", "K", "v")).toBe("K=v\n");
  });

  test("appends the key when absent, preserving other lines", () => {
    expect(upsertEnvLine("A=1\n", "K", "v")).toBe("A=1\nK=v\n");
  });

  test("replaces the value when the key is present", () => {
    expect(upsertEnvLine("A=1\nK=old\nB=2\n", "K", "new")).toBe(
      "A=1\nK=new\nB=2\n",
    );
  });

  test("is idempotent", () => {
    const once = upsertEnvLine("A=1\n", "K", "v");
    expect(upsertEnvLine(once, "K", "v")).toBe(once);
  });

  test("does not match keys by prefix", () => {
    expect(upsertEnvLine("KEY_LONG=1\n", "KEY", "v")).toBe(
      "KEY_LONG=1\nKEY=v\n",
    );
  });

  test("replaces a key written with spaces around the equals sign", () => {
    expect(upsertEnvLine("A = 1\n", "A", "2")).toBe("A=2\n");
  });

  test("ignores commented-out keys when matching", () => {
    expect(upsertEnvLine("# A=1\n", "A", "2")).toBe("# A=1\nA=2\n");
  });
});

describe("resolveConvexUrl", () => {
  test("prefers the override when both are set", () => {
    expect(
      resolveConvexUrl({ CONVEX_URL: "a", CONVEX_URL_OVERRIDE: "b" }),
    ).toEqual({ url: "b", source: "override" });
  });

  test("falls back to CONVEX_URL when no override", () => {
    expect(resolveConvexUrl({ CONVEX_URL: "a" })).toEqual({
      url: "a",
      source: "convex-url",
    });
  });

  test("falls back to VITE_CONVEX_URL when no override or CONVEX_URL", () => {
    expect(resolveConvexUrl({ VITE_CONVEX_URL: "a" })).toEqual({
      url: "a",
      source: "convex-url",
    });
  });

  test("treats a blank override as absent", () => {
    expect(
      resolveConvexUrl({ CONVEX_URL: "a", CONVEX_URL_OVERRIDE: "   " }),
    ).toEqual({ url: "a", source: "convex-url" });
  });

  test("returns undefined when neither is set", () => {
    expect(resolveConvexUrl({})).toBeUndefined();
  });

  test("returns undefined when CONVEX_URL is blank", () => {
    expect(resolveConvexUrl({ CONVEX_URL: "  " })).toBeUndefined();
  });
});
