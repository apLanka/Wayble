import { describe, expect, test } from "vitest";
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";
import {
  classifyReportError,
  reportErrorMessage,
  type ReportErrorKind,
} from "./report-errors";

/**
 * Every prefix the server can put in a thrown message, taken from
 * `packages/backend/convex/reports.ts`. A user's screen must never show one
 * of these; the app says it in its own words instead.
 */
const SERVER_PREFIXES = [
  "Unauthenticated:",
  "Unknown place:",
  "Add at least one accessibility attribute",
  "Duplicate accessibility attribute:",
  "Summary too long:",
  "Note too long:",
  "Observation time is outside the allowed range",
  "Duplicate report:",
];

const KINDS = [
  "duplicate",
  "unauthenticated",
  "summaryTooLong",
  "observationTime",
  "generic",
] as const satisfies readonly ReportErrorKind[];

/**
 * Compile-time proof that KINDS covers the whole union, so adding a kind
 * without a leak test is a `tsc` error rather than a silent coverage hole.
 * `satisfies` alone would not catch that: it checks each member is valid, not
 * that none is missing. Mirrors the same pattern over
 * `ACCESSIBILITY_ATTRIBUTE_KEYS` in `accessibility.ts`.
 */
type _EveryErrorKindIsListed =
  Exclude<ReportErrorKind, (typeof KINDS)[number]> extends never ? true : never;
const _everyErrorKindIsListed: _EveryErrorKindIsListed = true;
void _everyErrorKindIsListed;

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

  test("maps the observation-time rejection to observationTime", () => {
    expect(
      classifyReportError(
        new Error("Observation time is outside the allowed range"),
      ),
    ).toBe("observationTime");
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

  test("reads .message from a wrapped-object throw", () => {
    // `String({...})` renders "[object Object]", so without an explicit
    // `.message` read a wrapped throw silently became `generic`.
    expect(
      classifyReportError({
        message:
          "Duplicate report: you already reported on this place in the last 24 hours",
      }),
    ).toBe("duplicate");
  });
});

describe("reportErrorMessage", () => {
  test("no user-facing message contains a raw server prefix", () => {
    for (const kind of KINDS) {
      for (const prefix of SERVER_PREFIXES) {
        expect(reportErrorMessage(kind)).not.toContain(prefix);
      }
    }
  });

  test("interpolates the real summary cap", () => {
    expect(reportErrorMessage("summaryTooLong")).toContain(
      String(MAX_SUMMARY_LENGTH),
    );
  });

  test("states the summary cap as inclusive", () => {
    // The server accepts exactly MAX_SUMMARY_LENGTH and rejects
    // MAX_SUMMARY_LENGTH + 1, so "under 500" tells a user sitting at 500
    // characters to shorten for no reason.
    const message = reportErrorMessage("summaryTooLong");
    expect(message).toMatch(/or fewer/i);
    expect(message).not.toMatch(/\bunder\b/i);
  });

  test("the observation-time case names the clock the user can fix", () => {
    expect(reportErrorMessage("observationTime")).toMatch(/clock/i);
  });

  test("the observation-time message tells the user what to change", () => {
    const message = reportErrorMessage("observationTime");
    expect(message).toMatch(/clock/i);
    expect(message).toMatch(/date and time/i);
  });

  test("the generic message does not blame the connection", () => {
    // The generic case covers failures whose cause is genuinely unknown, so
    // telling the user to check their connection sends them down a dead end
    // when the real cause is something else entirely.
    expect(reportErrorMessage("generic")).not.toMatch(/connection/i);
  });

  test("gives the duplicate case a next action", () => {
    expect(reportErrorMessage("duplicate")).toMatch(/tomorrow/i);
  });
});
