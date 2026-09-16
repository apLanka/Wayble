import { describe, expect, test } from "vitest";
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";
import { classifyReportError, reportErrorMessage } from "./report-errors";

describe("classifyReportError", () => {
  test("maps the duplicate guard to duplicate", () => {
    expect(
      classifyReportError(
        new Error(
          "Duplicate report: you already reported on this place in the last 24 hours",
        ),
      ),
    ).toBe("duplicate");
  });

  test("maps the auth failure to unauthenticated", () => {
    expect(
      classifyReportError(
        new Error("Unauthenticated: must be logged in to submit a report"),
      ),
    ).toBe("unauthenticated");
  });

  test("maps the summary cap to summaryTooLong", () => {
    expect(
      classifyReportError(
        new Error("Summary too long: 501 characters, maximum 500"),
      ),
    ).toBe("summaryTooLong");
  });

  test("falls back to generic for an unrecognised message", () => {
    expect(classifyReportError(new Error("boom"))).toBe("generic");
  });

  test("falls back to generic for a non-Error throw", () => {
    expect(classifyReportError(undefined)).toBe("generic");
    expect(classifyReportError(null)).toBe("generic");
    expect(classifyReportError("something went wrong")).toBe("generic");
  });

  test("matches through a wrapped message", () => {
    expect(
      classifyReportError(
        new Error(
          "[Request ID: abc] Server Error: Unauthenticated: must be logged in to submit a report",
        ),
      ),
    ).toBe("unauthenticated");
  });
});

describe("reportErrorMessage", () => {
  test("never leaks a raw server string", () => {
    const kinds = [
      "duplicate",
      "unauthenticated",
      "summaryTooLong",
      "generic",
    ] as const;
    for (const kind of kinds) {
      const message = reportErrorMessage(kind);
      expect(message).not.toContain("Unauthenticated:");
      expect(message).not.toContain("Duplicate report:");
      expect(message.length).toBeGreaterThan(0);
    }
  });

  test("interpolates the real summary cap", () => {
    expect(reportErrorMessage("summaryTooLong")).toContain(
      String(MAX_SUMMARY_LENGTH),
    );
  });

  test("gives the duplicate case a next action", () => {
    expect(reportErrorMessage("duplicate")).toMatch(/tomorrow/i);
  });
});
