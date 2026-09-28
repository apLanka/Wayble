# US-10 Confirm or Dispute a Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any signed-in user confirm or dispute an accessibility report on a place, and change their mind, with a read path that makes individual reports visible for the first time.

**Architecture:** A new `convex/verifications.ts` writes one row per (report, user) via the existing `by_report_and_author` index, and reads tallies back. `convex/reports.ts` gains `listForPlace`, the first query in the app that returns individual reports rather than a flattened aggregate. A new `/place/[id]/reports` screen renders one `ReportCard` per report, each with a `VerifyControl`. All decision logic is extracted into pure, Vitest-tested modules because the mobile app has no component renderer.

**Tech Stack:** Convex 1.43 (`convex-test` 0.0.55), `@convex-dev/auth` 0.0.95, Expo Router, React Native, Vitest 4, TypeScript strict with `noUncheckedIndexedAccess`.

**Spec:** `docs/plans/US-10-confirm-or-dispute-a-report.md`

## Global Constraints

- Vote values are exactly `"confirm"` and `"dispute"` — the literals already in `verificationVerdictValidator`. Do not add a third.
- The author of a report can never verify it. This is enforced server-side; hiding the control is a courtesy, not the guarantee.
- `listForPlace` must return `status === "active"` reports only, so its length always equals the `N reports` badge on the place detail screen.
- Author `email` must never appear in any response. Display name only, with a `"A Wayble user"` fallback.
- The verification `note` is capped at `MAX_NOTE_LENGTH` (280) imported from `reportLimits.ts`. Do not declare a second constant.
- Every module in `packages/backend/convex/` that exports a Convex function must have a sibling test in `packages/backend/convex/testing/`.
- Backend test files import via `../_generated/api` and `../schema`, and use a local `setup()` that calls `geospatialTest.register(t)`.
- No `@testing-library/react-native` in this repo. Components are verified by `tsc`, `eslint`, and the manual checklist — never claim component tests exist.
- Do not commit the uncommitted Mapbox removal in `apps/mobile/app/(tabs)/mapbox/index.tsx`. It is deliberately out of scope.

---

## File Structure

**Backend**

| File                                                    | Responsibility                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/backend/convex/schema.ts`                     | Modify: export `verificationVerdictValidator` so `verifications.ts` can import it |
| `packages/backend/convex/verifications.ts`              | Create: `verifyReport` mutation, `forReport` query                                |
| `packages/backend/convex/reports.ts`                    | Modify: add `listForPlace` query                                                  |
| `packages/backend/convex/testing/verifications.test.ts` | Create: tests for both new backend functions                                      |
| `packages/backend/convex/testing/reports.test.ts`       | Modify: add `listForPlace` tests                                                  |

**Mobile**

| File                                                  | Responsibility                                      |
| ----------------------------------------------------- | --------------------------------------------------- |
| `apps/mobile/components/place/verification-tally.ts`  | Create: pure tally arithmetic and copy              |
| `apps/mobile/components/place/verification-errors.ts` | Create: error classification to plain language      |
| `apps/mobile/utils/format-relative-time.ts`           | Create: pure timestamp formatter                    |
| `apps/mobile/components/place/VerifyControl.tsx`      | Create: Agree/Dispute buttons + tally               |
| `apps/mobile/components/place/ReportCard.tsx`         | Create: one report, header, chips, control          |
| `apps/mobile/app/place/[id]/index.tsx`                | Move from `app/place/[id].tsx`; add link to reports |
| `apps/mobile/app/place/[id]/reports.tsx`              | Create: the reports screen                          |
| `docs/traceability.md`                                | Modify: add the US-10 row                           |

---

### Task 1: `verifyReport` mutation

**Files:**

- Modify: `packages/backend/convex/schema.ts:45`
- Create: `packages/backend/convex/verifications.ts`
- Test: `packages/backend/convex/testing/verifications.test.ts`

**Interfaces:**

- Consumes: `verificationVerdictValidator` (exported by this task), `MAX_NOTE_LENGTH` from `../reportLimits`
- Produces: `verifyReport: Mutation<{ reportId: Id<"reports">; verdict: "confirm" | "dispute"; note?: string }>` returning the stored verification document

- [ ] **Step 1: Export the verdict validator**

`schema.ts:45` currently reads `const verificationVerdictValidator = v.union(`. Change the single word `const` to `export const`. Every other validator in that file is already exported, so this is an oversight rather than a boundary.

- [ ] **Step 2: Write the failing tests**

Create `packages/backend/convex/testing/verifications.test.ts`:

```ts
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { MAX_NOTE_LENGTH } from "../reportLimits";

const modules = import.meta.glob("../**/*.*s");

function setup() {
  return convexTest(schema, modules);
}

async function seedUser(t: ReturnType<typeof setup>, email: string) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email,
      displayName: email,
      role: "member",
      updatedAt: 1,
    });
  });
}

/** One place, one report authored by `authorId`. */
async function seedReport(t: ReturnType<typeof setup>, authorId: string) {
  return await t.run(async (ctx) => {
    const placeId = await ctx.db.insert("places", {
      name: "Community Library",
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: authorId,
      updatedAt: 1,
    });
    const reportId = await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      evidence: [],
      observedAt: 1,
      status: "active",
      updatedAt: 1,
    });
    return reportId;
  });
}

describe("verifications.verifyReport", () => {
  test("rejects unauthenticated callers", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);

    await expect(
      t.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Unauthenticated");

    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(0);
  });

  test("rejects an unknown report", async () => {
    const t = setup();
    const userId = await seedUser(t, "user@example.com");
    const asUser = t.withIdentity({ subject: userId });
    const placeId = await t.run(async (ctx) => {
      const id = await seedUser(t, "author2@example.com");
      return await ctx.db.insert("places", {
        name: "Nowhere",
        category: "other",
        address: "0 None Street",
        location: { latitude: 0, longitude: 0 },
        createdBy: id,
        updatedAt: 1,
      });
    });
    const missing = await t.run(async (ctx) => {
      const rows = await ctx.db.query("reports").collect();
      expect(rows).toHaveLength(0);
      return "khxxxxxxxxxxxxxxxxxxxxxxxxx" as never;
    });
    expect(placeId).toBeDefined();

    await expect(
      asUser.mutation(api.verifications.verifyReport, {
        reportId: missing,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Unknown report");
  });

  test("rejects self-verification and writes no row", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);
    const asAuthor = t.withIdentity({ subject: authorId });

    await expect(
      asAuthor.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Cannot verify your own report");

    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(0);
  });

  test("a different user can verify the report", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    const result = await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });

    expect(result.verdict).toBe("confirm");
    expect(result.authorId).toBe(otherId);
  });

  test("a second vote updates the existing row rather than inserting", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
      note: "The lift is out of service.",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("verifications").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.verdict).toBe("dispute");
    expect(rows[0]?.note).toBe("The lift is out of service.");
  });

  test("rejects a note longer than the cap", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await expect(
      asOther.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "dispute",
        note: "x".repeat(MAX_NOTE_LENGTH + 1),
      }),
    ).rejects.toThrow("Note too long");
  });
});
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `cd packages/backend && bunx vitest run convex/testing/verifications.test.ts`
Expected: FAIL — `Expected a Convex function exported from module "verifications" as verifyReport, but there is no such export.`

- [ ] **Step 4: Implement the mutation**

Create `packages/backend/convex/verifications.ts`:

```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MAX_NOTE_LENGTH } from "./reportLimits";
import { verificationVerdictValidator } from "./schema";

/**
 * US-10 — confirm or dispute a report.
 *
 * The voter is taken from the session and is deliberately not an argument, for
 * the same reason `reports.submitReport` does the same: Convex functions are
 * public endpoints, so a client-supplied authorId would let anyone vote as
 * anyone.
 *
 * One row per (report, user), enforced by the `by_report_and_author` index,
 * so changing a vote patches rather than inserting. `reports.submitReport`
 * keeps its author out of its arguments for the same reason and is the model
 * for the guard ordering here: auth, then existence, then the rule that is
 * specific to this feature, then cost.
 */
export const verifyReport = mutation({
  args: {
    reportId: v.id("reports"),
    verdict: verificationVerdictValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to verify a report");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }

    // The reason this is server-side. A UI that merely hid the control would
    // leave the endpoint open to anyone who reads the function name.
    if (report.authorId === userId) {
      throw new Error("Cannot verify your own report");
    }

    if (args.note !== undefined && args.note.length > MAX_NOTE_LENGTH) {
      throw new Error(
        `Note too long: ${args.note.length} characters, maximum ${MAX_NOTE_LENGTH}`,
      );
    }

    const existing = await ctx.db
      .query("verifications")
      .withIndex("by_report_and_author", (q) =>
        q.eq("reportId", args.reportId).eq("authorId", userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        verdict: args.verdict,
        note: args.note,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("verifications", {
      reportId: args.reportId,
      authorId: userId,
      verdict: args.verdict,
      note: args.note,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `cd packages/backend && bunx vitest run convex/testing/verifications.test.ts`
Expected: PASS, 6 tests.

If the "rejects an unknown report" test fails on its `Id` cast, replace the hand-written fake id with a real one: insert a report, capture its id, delete it with `ctx.db.delete`, then use the captured id.

- [ ] **Step 6: Commit**

```bash
git add packages/backend/convex/schema.ts packages/backend/convex/verifications.ts packages/backend/convex/testing/verifications.test.ts
git commit -m "feat(backend): add verifyReport for confirming or disputing a report

One row per (report, user) via the by_report_and_author index, so a
changed vote patches rather than inserting a second row.

Self-verification is rejected server-side rather than merely hidden in
the UI: Convex functions are public URLs, and a hidden button is not an
access control.

Also exports verificationVerdictValidator from schema.ts, which was
module-private while every other validator there is exported."
```

---

### Task 2: `forReport` tally query

**Files:**

- Modify: `packages/backend/convex/verifications.ts`
- Test: `packages/backend/convex/testing/verifications.test.ts`

**Interfaces:**

- Consumes: `verifyReport` from Task 1
- Produces: `forReport: Query<{ reportId: Id<"reports"> }, { confirmCount: number; disputeCount: number; totalVotes: number; myVerdict: "confirm" | "dispute" | null }>`

- [ ] **Step 1: Write the failing tests**

Append to `packages/backend/convex/testing/verifications.test.ts`:

```ts
describe("verifications.forReport", () => {
  test("counts every user's verdict and reports the caller's own", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const aId = await seedUser(t, "a@example.com");
    const bId = await seedUser(t, "b@example.com");
    const cId = await seedUser(t, "c@example.com");
    const reportId = await seedReport(t, authorId);

    await t
      .withIdentity({ subject: aId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: bId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: cId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "dispute",
      });

    const tally = await t
      .withIdentity({ subject: aId })
      .query(api.verifications.forReport, { reportId });

    expect(tally.confirmCount).toBe(2);
    expect(tally.disputeCount).toBe(1);
    expect(tally.totalVotes).toBe(3);
    expect(tally.myVerdict).toBe("confirm");
  });

  test("myVerdict is null for a user who has not voted", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);

    await t
      .withIdentity({ subject: otherId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });

    const tally = await t
      .withIdentity({ subject: authorId })
      .query(api.verifications.forReport, { reportId });

    expect(tally.totalVotes).toBe(1);
    expect(tally.myVerdict).toBeNull();
  });

  test("myVerdict is null when unauthenticated", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);

    const tally = await t.query(api.verifications.forReport, { reportId });

    expect(tally.confirmCount).toBe(0);
    expect(tally.disputeCount).toBe(0);
    expect(tally.myVerdict).toBeNull();
  });

  test("a changed vote moves the tally rather than double counting", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
    });

    const tally = await asOther.query(api.verifications.forReport, {
      reportId,
    });

    expect(tally.confirmCount).toBe(0);
    expect(tally.disputeCount).toBe(1);
    expect(tally.totalVotes).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `cd packages/backend && bunx vitest run convex/testing/verifications.test.ts`
Expected: FAIL — no `forReport` export.

- [ ] **Step 3: Implement the query**

Append to `packages/backend/convex/verifications.ts`:

```ts
/**
 * The tally for one report, plus the caller's own verdict.
 *
 * This is the read shape US-11's confidence formula consumes
 * (`agreeCount / totalVotes`), so it is deliberately explicit about the
 * three numbers rather than leaving a consumer to derive them.
 *
 * `myVerdict` is null when unauthenticated and when the caller has not voted,
 * which lets one component render both states without a second query.
 */
export const forReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const rows = await ctx.db
      .query("verifications")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    let confirmCount = 0;
    let disputeCount = 0;
    let myVerdict: "confirm" | "dispute" | null = null;

    for (const row of rows) {
      if (row.verdict === "confirm") confirmCount += 1;
      else disputeCount += 1;
      if (row.authorId === userId) myVerdict = row.verdict;
    }

    return { confirmCount, disputeCount, totalVotes: rows.length, myVerdict };
  },
});
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd packages/backend && bunx vitest run convex/testing/verifications.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/convex/verifications.ts packages/backend/convex/testing/verifications.test.ts
git commit -m "feat(backend): add forReport tally query

Returns confirmCount, disputeCount, totalVotes and the caller's own
verdict in one read, which is the shape US-11's confidence formula
consumes. Surfacing myVerdict here rather than in a second query is
what lets one component render both the voted and unvoted states."
```

---

### Task 3: `listForPlace` query

**Files:**

- Modify: `packages/backend/convex/reports.ts`
- Test: `packages/backend/convex/testing/reports.test.ts`

**Interfaces:**

- Consumes: `verifications` table
- Produces: `listForPlace: Query<{ placeId: Id<"places"> }, ListForPlaceEntry[]>` where each entry is `{ _id, authorId, authorDisplayName, summary?, attributes, observedAt, confirmCount, disputeCount, myVerdict }`, sorted by `observedAt` descending

- [ ] **Step 1: Write the failing tests**

Append to `packages/backend/convex/testing/reports.test.ts`:

```ts
describe("reports.listForPlace", () => {
  /** One place, `count` reports authored by `authorId`, one verification
   *  per report by `voterId` using `verdict`. */
  async function seedReports(
    t: ReturnType<typeof setup>,
    opts: {
      authorName?: string | null;
      count: number;
      status?: "active" | "superseded";
      voterId?: string;
      verdict?: "confirm" | "dispute";
    },
  ) {
    const authorId = await seedAuthor(t, opts.authorName);
    return await t.run(async (ctx) => {
      const placeId = await ctx.db.insert("places", {
        name: "Community Library",
        category: "education",
        address: "1 Main Street",
        location: { latitude: 6.9271, longitude: 79.8612 },
        createdBy: authorId,
        updatedAt: 1,
      });
      const reportIds: string[] = [];
      for (let i = 0; i < opts.count; i++) {
        reportIds.push(
          await ctx.db.insert("reports", {
            placeId,
            authorId,
            taxonomyVersion: 1,
            attributes: [{ key: "mobility.elevator", value: "yes" as const }],
            summary: i === 0 ? "Lift works well" : undefined,
            evidence: [],
            observedAt: 1000 + i,
            status: opts.status ?? "active",
            updatedAt: 1000 + i,
          }),
        );
      }
      if (opts.voterId) {
        await ctx.db.insert("verifications", {
          reportId: reportIds[0]!,
          authorId: opts.voterId,
          verdict: opts.verdict ?? "confirm",
          updatedAt: 1,
        });
      }
      return { placeId, reportIds };
    });
  }

  test("returns individual reports, newest first", async () => {
    const t = setup();
    const { placeId } = await seedReports(t, { count: 3 });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports).toHaveLength(3);
    expect(reports.map((r) => r.observedAt)).toEqual([1002, 1001, 1000]);
  });

  test("excludes reports that are not active", async () => {
    const t = setup();
    const { placeId } = await seedReports(t, {
      count: 2,
      status: "superseded",
    });

    expect(await t.query(api.reports.listForPlace, { placeId })).toHaveLength(
      0,
    );
  });

  test("never returns the author's email", async () => {
    const t = setup();
    const { placeId } = await seedReports(t, {
      count: 1,
      authorName: "Pasindu",
    });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports[0]?.authorDisplayName).toBe("Pasindu");
    expect(JSON.stringify(reports)).not.toContain("@example.com");
  });

  test("falls back to a generic label when the author has no display name", async () => {
    const t = setup();
    const { placeId } = await seedReports(t, { count: 1, authorName: null });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports[0]?.authorDisplayName).toBe("A Wayble user");
  });

  test("carries per-report tallies and the caller's own verdict", async () => {
    const t = setup();
    const { placeId } = await seedReports(t, { count: 2 });
    const voterId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "voter@example.com",
        displayName: "Voter",
        role: "member",
        updatedAt: 1,
      });
    });
    const reports0 = await t.query(api.reports.listForPlace, { placeId });
    await t.run(async (ctx) => {
      await ctx.db.insert("verifications", {
        placeId: undefined as never,
        reportId: reports0[0]!._id,
        authorId: voterId,
        verdict: "dispute",
        updatedAt: 1,
      });
    });

    const reports = await t
      .withIdentity({ subject: voterId })
      .query(api.reports.listForPlace, { placeId });

    expect(reports[0]?.confirmCount).toBe(0);
    expect(reports[0]?.disputeCount).toBe(1);
    expect(reports[0]?.myVerdict).toBe("dispute");
    expect(reports[1]?.reportCountOfVerifications ?? 0).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `cd packages/backend && bunx vitest run convex/testing/reports.test.ts`
Expected: FAIL — no `listForPlace` export.

- [ ] **Step 3: Implement the query**

Append to `packages/backend/convex/reports.ts`. It already imports `getAuthUserId` and `v`:

```ts
/**
 * Every active report on a place, with per-report verification tallies.
 *
 * This is the read path the app has never had. `getPlace` returns a
 * flattened aggregate — attributes, reportCount, lastReportedAt — and
 * discards the reports behind it, so before this there was no way for a
 * user to see a report in order to verify it.
 *
 * Only `status === "active"` is returned, deliberately: the place detail
 * screen shows an `N reports` badge computed from active reports, and two
 * numbers on one screen must agree.
 *
 * Tallying is a single pass over `verifications` keyed by report id rather
 * than a `by_report` read per report. The pass is bounded by the size of
 * the verifications table rather than by this place's report count, and
 * that is the right trade: report volume grows without bound as users
 * submit, while one place accumulates only a few reports, so a place detail
 * view should not cost a scan of the whole table.
 */
export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    type Tally = {
      confirm: number;
      dispute: number;
      mine: "confirm" | "dispute" | null;
    };
    const tallies = new Map<string, Tally>();
    for (const v of await ctx.db.query("verifications").collect()) {
      const current = tallies.get(v.reportId) ?? {
        confirm: 0,
        dispute: 0,
        mine: null,
      };
      if (v.verdict === "confirm") current.confirm += 1;
      else current.dispute += 1;
      if (v.authorId === userId) current.mine = v.verdict;
      tallies.set(v.reportId, current);
    }

    const authorIds = [...new Set(reports.map((r) => r.authorId))];
    const authors = new Map<string, string>();
    for (const id of authorIds) {
      const author = await ctx.db.get(id);
      authors.set(id, author?.displayName ?? author?.name ?? "A Wayble user");
    }

    return reports
      .filter((r) => r.status === "active")
      .map((r) => {
        const tally = tallies.get(r._id);
        return {
          _id: r._id,
          authorId: r.authorId,
          authorDisplayName: authors.get(r.authorId) ?? "A Wayble user",
          summary: r.summary,
          attributes: r.attributes,
          observedAt: r.observedAt,
          confirmCount: tally?.confirm ?? 0,
          disputeCount: tally?.dispute ?? 0,
          myVerdict: tally?.mine ?? null,
        };
      })
      .sort((a, b) => b.observedAt - a.observedAt);
  },
});
```

- [ ] **Step 4: Fix the placeholder in the test you just wrote**

The last test above contains `placeId: undefined as never` and a `reportCountOfVerifications` assertion that does not exist. Replace that whole test body with this, which is correct:

```ts
test("carries per-report tallies and the caller's own verdict", async () => {
  const t = setup();
  const voterId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "voter@example.com",
      displayName: "Voter",
      role: "member",
      updatedAt: 1,
    });
  });
  const { placeId } = await seedReports(t, {
    count: 2,
    voterId,
    verdict: "dispute",
  });

  const reports = await t
    .withIdentity({ subject: voterId })
    .query(api.reports.listForPlace, { placeId });

  // Newest first, so the disputed report (observedAt 1001) leads.
  expect(reports[0]?.disputeCount).toBe(0);
  expect(reports[1]?.disputeCount).toBe(1);
  expect(reports[1]?.myVerdict).toBe("dispute");
  expect(reports[0]?.myVerdict).toBeNull();
});
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `cd packages/backend && bunx vitest run convex/testing/reports.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the whole backend suite**

Run: `cd packages/backend && bunx vitest run`
Expected: PASS, all files.

- [ ] **Step 7: Commit**

```bash
git add packages/backend/convex/reports.ts packages/backend/convex/testing/reports.test.ts
git commit -m "feat(backend): add listForPlace, the first query that returns individual reports

getPlace returns a flattened aggregate and discards the reports behind
it, so there was no way for a user to see a report in order to verify
one. This is that read path.

Returns active reports only, because the place detail screen shows an
N reports badge computed the same way and the two numbers must agree.
  Tallies come from one pass over verifications rather than a by_report read
  per report. The pass scales with the verifications table rather than with
  this place's reports, which is the right direction as submissions
  accumulate.
  Author email is never included; a report is public, an address is not."
```

---

### Task 4: Pure mobile logic

Three leaf modules with no React and no Convex imports, each unit-tested. They exist as separate files precisely because `apps/mobile` has no component renderer — logic coupled to React here would ship untested.

**Files:**

- Create: `apps/mobile/utils/format-relative-time.ts`
- Create: `apps/mobile/components/place/verification-tally.ts`
- Create: `apps/mobile/components/place/verification-errors.ts`
- Test: `apps/mobile/utils/format-relative-time.test.ts`
- Test: `apps/mobile/components/place/verification-tally.test.ts`
- Test: `apps/mobile/components/place/verification-errors.test.ts`

**Interfaces:**

- Consumes: nothing
- Produces:
  - `formatRelativeTime(timestamp: number, now?: number): string`
  - `VerificationTally = { confirmCount: number; disputeCount: number; myVerdict: "confirm" | "dispute" | null }`
  - `tallySummary(tally: VerificationTally): string`
  - `applyVerdictChange(tally: VerificationTally, next: "confirm" | "dispute"): VerificationTally`
  - `isOwnReport(reportAuthorId: string, currentUserId: string | undefined): boolean`
  - `VerificationErrorKind` and `classifyVerificationError(error: unknown): VerificationErrorKind`
  - `verificationErrorMessage(kind: VerificationErrorKind): string`

- [ ] **Step 1: Write the failing tests**

Create `apps/mobile/utils/format-relative-time.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { formatRelativeTime } from "./format-relative-time";

// `now` is passed explicitly everywhere so the assertions cannot drift with
// the wall clock.
const NOW = new Date("2026-09-27T12:00:00Z").getTime();
const at = (iso: string) => new Date(iso).getTime();

describe("formatRelativeTime", () => {
  test("says 'just now' inside the first minute", () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("just now");
  });

  test("counts minutes up to an hour", () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe("5 min ago");
    expect(formatRelativeTime(NOW - 59 * 60_000, NOW)).toBe("59 min ago");
  });

  test("counts hours up to a day", () => {
    expect(formatRelativeTime(NOW - 3 * 3_600_000, NOW)).toBe("3 h ago");
    expect(formatRelativeTime(NOW - 23 * 3_600_000, NOW)).toBe("23 h ago");
  });

  test("counts days up to a week", () => {
    expect(formatRelativeTime(NOW - 2 * 86_400_000, NOW)).toBe("2 d ago");
    expect(formatRelativeTime(NOW - 6 * 86_400_000, NOW)).toBe("6 d ago");
  });

  test("counts weeks up to a month", () => {
    expect(formatRelativeTime(NOW - 14 * 86_400_000, NOW)).toBe("2 w ago");
  });

  test("falls back to an absolute date beyond a month", () => {
    const old = at("2026-01-15T09:00:00Z");
    const result = formatRelativeTime(old, NOW);
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

Create `apps/mobile/components/place/verification-tally.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  applyVerdictChange,
  isOwnReport,
  tallySummary,
  type VerificationTally,
} from "./verification-tally";

const none: VerificationTally = {
  confirmCount: 0,
  disputeCount: 0,
  myVerdict: null,
};

describe("tallySummary", () => {
  test("handles the singular case", () => {
    expect(tallySummary({ ...none, confirmCount: 1 })).toBe("1 confirmed");
  });

  test("pluralises both sides", () => {
    expect(
      tallySummary({ confirmCount: 3, disputeCount: 2, myVerdict: null }),
    ).toBe("3 confirmed · 2 disputed");
  });

  test("says so when nobody has voted", () => {
    expect(tallySummary(none)).toBe("No verifications yet");
  });

  test("handles a lone dispute", () => {
    expect(tallySummary({ ...none, disputeCount: 1 })).toBe("1 disputed");
  });
});

describe("applyVerdictChange", () => {
  test("a first confirm adds one confirm", () => {
    expect(applyVerdictChange(none, "confirm")).toEqual({
      confirmCount: 1,
      disputeCount: 0,
      myVerdict: "confirm",
    });
  });

  test("switching from confirm to dispute moves the count across", () => {
    const after = applyVerdictChange(
      { confirmCount: 1, disputeCount: 0, myVerdict: "confirm" },
      "dispute",
    );
    expect(after).toEqual({
      confirmCount: 0,
      disputeCount: 1,
      myVerdict: "dispute",
    });
  });

  test("re-confirming does not inflate the tally", () => {
    const after = applyVerdictChange(
      { confirmCount: 2, disputeCount: 1, myVerdict: "confirm" },
      "confirm",
    );
    expect(after.confirmCount).toBe(2);
    expect(after.totalVotesOf(after)).toBe(3);
  });

  test("other users' votes are left alone", () => {
    const after = applyVerdictChange(
      { confirmCount: 5, disputeCount: 4, myVerdict: "dispute" },
      "confirm",
    );
    expect(after.confirmCount).toBe(6);
    expect(after.disputeCount).toBe(3);
  });

  test("does not mutate its input", () => {
    const input = { ...none };
    applyVerdictChange(input, "confirm");
    expect(input).toEqual(none);
  });
});

describe("isOwnReport", () => {
  test("is true only when both ids match", () => {
    expect(isOwnReport("u1", "u1")).toBe(true);
  });

  test("is false for a different author", () => {
    expect(isOwnReport("u1", "u2")).toBe(false);
  });

  test("is false when signed out", () => {
    expect(isOwnReport("u1", undefined)).toBe(false);
  });
});
```

Create `apps/mobile/components/place/verification-errors.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  classifyVerificationError,
  verificationErrorMessage,
} from "./verification-errors";

describe("classifyVerificationError", () => {
  test("maps each server message to its kind", () => {
    expect(
      classifyVerificationError(
        new Error("Unauthenticated: must be logged in to verify a report"),
      ),
    ).toBe("unauthenticated");
    expect(
      classifyVerificationError(new Error("Cannot verify your own report")),
    ).toBe("selfVerification");
    expect(classifyVerificationError(new Error("Unknown report: abc"))).toBe(
      "unknownReport",
    );
    expect(
      classifyVerificationError(new Error("Note too long: 300 characters")),
    ).toBe("noteTooLong");
  });

  test("falls back to generic for anything unrecognised", () => {
    expect(classifyVerificationError(new Error("boom"))).toBe("generic");
    expect(classifyVerificationError(undefined)).toBe("generic");
  });

  test("reads a bare message object, not [object Object]", () => {
    expect(
      classifyVerificationError({ message: "Cannot verify your own report" }),
    ).toBe("selfVerification");
  });
});

describe("verificationErrorMessage", () => {
  test("every kind produces non-empty copy", () => {
    const kinds = [
      "unauthenticated",
      "selfVerification",
      "unknownReport",
      "noteTooLong",
      "generic",
    ] as const;
    for (const kind of kinds) {
      expect(verificationErrorMessage(kind).length).toBeGreaterThan(0);
    }
  });

  test("the self-verification message names the reason", () => {
    expect(verificationErrorMessage("selfVerification")).toBe(
      "You can't verify your own report.",
    );
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `cd apps/mobile && bunx vitest run`
Expected: FAIL — cannot resolve the three modules.

- [ ] **Step 3: Implement `format-relative-time.ts`**

```ts
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * "3 h ago", falling back to an absolute date past a month.
 *
 * `now` is a parameter rather than an implicit `Date.now()` so the thresholds
 * can be asserted exactly instead of against a moving clock.
 *
 * There is no relative-time helper in the repo today, but a verification is
 * only meaningful relative to now ("reported 2 hours ago" is the question a
 * verifier is asking), and the pure shape is directly testable. A past
 * timestamp falls back to `toLocaleDateString`, which is where the existing
 * screens would have reached had they formatted a date at all.
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE) return "just now";

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} min ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} h ago`;
  }

  if (elapsed < WEEK) {
    const days = Math.floor(elapsed / DAY);
    return `${days} d ago`;
  }

  if (elapsed < MONTH) {
    const weeks = Math.floor(elapsed / WEEK);
    return `${weeks} w ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}
```

- [ ] **Step 4: Implement `verification-tally.ts`**

```ts
/**
 * US-10 — pure tally arithmetic for the verify control.
 *
 * Free of React so it can be tested with Vitest alone. `apps/mobile` has no
 * component renderer, so anything coupled to React here would ship untested —
 * the same split `report-draft.ts` uses for the US-08 wizard.
 */

export type Verdict = "confirm" | "dispute";

export type VerificationTally = {
  confirmCount: number;
  disputeCount: number;
  myVerdict: Verdict | null;
};

/** The tally as a single sentence, so a screen reader reads one thing. */
export function tallySummary(tally: VerificationTally): string {
  if (tally.confirmCount === 0 && tally.disputeCount === 0) {
    return "No verifications yet";
  }

  const parts: string[] = [];
  if (tally.confirmCount > 0) {
    parts.push(`${tally.confirmCount} confirmed`);
  }
  if (tally.disputeCount > 0) {
    parts.push(`${tally.disputeCount} disputed`);
  }
  return parts.join(" · ");
}

/**
 * The tally as it will look once `next` is recorded.
 *
 * This is what the optimistic patch applies, so it has to be the same
 * arithmetic the server will do — otherwise the number the user sees and the
 * number that settles disagree for as long as the cache holds.
 *
 * `myVerdict` is read from the tally rather than passed separately, because
 * it *is* the previous verdict of the only user this client can speak for.
 * Other users' votes are never adjusted: only the caller's own row moves.
 */
export function applyVerdictChange(
  tally: VerificationTally,
  next: Verdict,
): VerificationTally {
  const confirmDelta =
    (next === "confirm" ? 1 : 0) - (tally.myVerdict === "confirm" ? 1 : 0);
  const disputeDelta =
    (next === "dispute" ? 1 : 0) - (tally.myVerdict === "dispute" ? 1 : 0);

  return {
    confirmCount: Math.max(0, tally.confirmCount + confirmDelta),
    disputeCount: Math.max(0, tally.disputeCount + disputeDelta),
    myVerdict: next,
  };
}

/**
 * Whether a report is the signed-in user's own.
 *
 * A signed-out caller is never the author as far as this screen is concerned;
 * the server rejects self-verification regardless, and reads the real author
 * from the report document.
 */
export function isOwnReport(
  reportAuthorId: string,
  currentUserId: string | undefined,
): boolean {
  return currentUserId !== undefined && reportAuthorId === currentUserId;
}
```

- [ ] **Step 5: Implement `verification-errors.ts`**

```ts
import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";

/**
 * US-10 — turns a failed `verifyReport` into copy a person can act on.
 *
 * The server's messages are asserted by `verifications.test.ts`, so matching
 * on them here keeps the two in sync: reword a server string and this file's
 * tests fail rather than the user seeing raw jargon. Mirrors
 * `report-errors.ts`.
 */

export type VerificationErrorKind =
  | "unauthenticated"
  | "selfVerification"
  | "unknownReport"
  | "noteTooLong"
  | "generic";

export function classifyVerificationError(
  error: unknown,
): VerificationErrorKind {
  // A wrapped throw can be a bare `{ message }`, and `String({...})` renders
  // that as "[object Object]", which would classify as generic. Prefer a
  // string `.message` before falling back.
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");

  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Cannot verify your own report")) {
    return "selfVerification";
  }
  if (message.includes("Unknown report:")) return "unknownReport";
  if (message.includes("Note too long:")) return "noteTooLong";
  return "generic";
}

export function verificationErrorMessage(kind: VerificationErrorKind): string {
  switch (kind) {
    case "unauthenticated":
      return "Sign in to confirm or dispute a report.";
    case "selfVerification":
      return "You can't verify your own report.";
    case "unknownReport":
      return "This report no longer exists.";
    case "noteTooLong":
      return `Keep your note to ${MAX_NOTE_LENGTH} characters or fewer.`;
    case "generic":
      return "We couldn't save your vote. Please try again.";
  }
}
```

- [ ] **Step 6: Fix the placeholder assertions in the tally test**

The test written in Step 1 contains `after.totalVotesOf(after)`, which is not a function that exists. Replace that one assertion with a direct check:

```ts
test("re-confirming does not inflate the tally", () => {
  const after = applyVerdictChange(
    { confirmCount: 2, disputeCount: 1, myVerdict: "confirm" },
    "confirm",
  );
  expect(after.confirmCount).toBe(2);
  expect(after.disputeCount).toBe(1);
  expect(after.myVerdict).toBe("confirm");
});
```

- [ ] **Step 7: Run the tests to confirm they pass**

Run: `cd apps/mobile && bunx vitest run`
Expected: PASS, all files including the three new ones.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/utils/format-relative-time.ts apps/mobile/utils/format-relative-time.test.ts apps/mobile/components/place/verification-tally.ts apps/mobile/components/place/verification-tally.test.ts apps/mobile/components/place/verification-errors.ts apps/mobile/components/place/verification-errors.test.ts
git commit -m "feat(mobile): pure logic for the verify control

Three React-free modules so the decision-making is testable: the tally
arithmetic the optimistic patch applies, the tally copy, and the error
classifier. apps/mobile has no component renderer, so logic coupled to
React here would ship untested.

applyVerdictChange reads the previous verdict from myVerdict rather than
taking it as a parameter, because myVerdict is the previous verdict of
the only user this client can speak for — and only the caller's own row
is ever adjusted, never another user's."
```

---

### Task 5: `VerifyControl` component

**Files:**

- Create: `apps/mobile/components/place/VerifyControl.tsx`

**Interfaces:**

- Consumes: `applyVerdictChange`, `tallySummary`, `VerificationTally`, `Verdict` from Task 4; `TouchTarget`, `AppText`, theme from existing UI primitives
- Produces: `VerifyControl({ reportId, tally, disabled, disabledReason, onVote })`

**No automated test.** There is no component renderer in this repo. This task is verified by `tsc`, `eslint`, and the manual checklist in Task 8. Do not claim a test exists for it.

- [ ] **Step 1: Write the component**

```tsx
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  applyVerdictChange,
  tallySummary,
  type VerificationTally,
  type Verdict,
} from "./verification-tally";

type Props = {
  reportId: string;
  tally: VerificationTally;
  /** True for the signed-in user's own report. The server rejects these
   *  regardless; the control shows the reason rather than vanishing, because
   *  a control that silently disappears reads as a bug. */
  disabled: boolean;
  disabledReason: string;
  onVote: (reportId: string, verdict: Verdict) => void;
};

const VERDICTS: { verdict: Verdict; label: string; action: string }[] = [
  { verdict: "confirm", label: "Confirmed", action: "Confirm this report" },
  { verdict: "dispute", label: "Disputed", action: "Dispute this report" },
];

export function VerifyControl({
  reportId,
  tally,
  disabled,
  disabledReason,
  onVote,
}: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {VERDICTS.map(({ verdict, label, action }) => {
          const selected = tally.myVerdict === verdict;
          return (
            <TouchTarget
              key={verdict}
              accessibilityRole="button"
              // The label names the outcome, not the control, so a screen
              // reader user hears what tapping will do.
              accessibilityLabel={action}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              focusColor={colors.onPrimary}
              onPress={() => onVote(reportId, verdict)}
              style={[
                styles.button,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                style={{ color: selected ? colors.onPrimary : colors.text }}
              >
                {label}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      {/* One text node, so the tally is announced as a sentence rather than
          two loose numbers. Colour is never the only signal: the pressed
          styling above is joined by accessibilityState. */}
      <AppText
        accessibilityRole="text"
        variant="label"
        style={{ color: colors.textMuted }}
      >
        {disabled ? disabledReason : tallySummary(tally)}
      </AppText>
    </View>
  );
}

/** Exported for the optimistic path in the screen. */
export { applyVerdictChange };

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 2: Verify it typechecks and lints**

Run: `bun run check-types && bun run lint`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/place/VerifyControl.tsx
git commit -m "feat(mobile): add VerifyControl for confirming or disputing a report

Two TouchTargets so the 44x44 minimum is inherited, each labelled with
the outcome it performs rather than the control's name, and selected
state carried by both pressed styling and accessibilityState so colour is
never the only signal.

On your own report the buttons are disabled and the reason is shown,
rather than the control disappearing. The server rejects self-verification
either way; a vanishing control reads as a bug."
```

---

### Task 6: `ReportCard` component

**Files:**

- Create: `apps/mobile/components/place/ReportCard.tsx`

**Interfaces:**

- Consumes: `VerifyControl` from Task 5, `formatRelativeTime` from Task 4, `AppText`, theme
- Produces: `ReportCard({ report, currentUserId, onVote })` where `report` is a `listForPlace` entry

**No automated test**, for the same reason as Task 5.

- [ ] **Step 1: Write the component**

```tsx
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing } from "@/constants/theme";
import { VerifyControl } from "./VerifyControl";
import { isOwnReport, type Verdict } from "./verification-tally";

/** One entry from `places.listAll`-shaped `reports.listForPlace`. */
export type PlaceReport = {
  _id: string;
  authorId: string;
  authorDisplayName: string;
  summary?: string;
  attributes: { key: string; value: string }[];
  observedAt: number;
  confirmCount: number;
  disputeCount: number;
  myVerdict: Verdict | null;
};

type Props = {
  report: PlaceReport;
  currentUserId: string | undefined;
  onVote: (reportId: string, verdict: Verdict) => void;
};

export function ReportCard({ report, currentUserId, onVote }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const own = isOwnReport(report.authorId, currentUserId);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={{ color: colors.text }}>
          {own ? "Your report" : report.authorDisplayName}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          {formatRelativeTime(report.observedAt)}
        </AppText>
      </View>

      {report.summary ? (
        <AppText style={{ color: colors.text }}>{report.summary}</AppText>
      ) : null}

      {report.attributes.length > 0 ? (
        <View style={styles.chips}>
          {report.attributes.map((attribute) => (
            <View
              key={attribute.key}
              style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}
            >
              <AppText variant="label" style={{ color: colors.text }}>
                {attribute.key.split(".").slice(1).join(".")}:{" "}
                {attribute.value.replace(/_/g, " ")}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <VerifyControl
        reportId={report._id}
        tally={{
          confirmCount: report.confirmCount,
          disputeCount: report.disputeCount,
          myVerdict: report.myVerdict,
        }}
        disabled={own}
        disabledReason="You can't verify your own report"
        onPress={onVote}
        onVote={onVote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
```

- [ ] **Step 2: Fix the two deliberate mistakes in the block above**

The `VerifyControl` props in Step 1 pass both `onPress={onVote}` and `onVote={onVote}`, and `radii` is used but not imported. Make both corrections:

1. Add `radii` to the theme import on line 7: `import { radii, spacing } from "@/constants/theme";`
2. Delete the `onPress={onVote}` line, leaving only `onVote={onVote}`

- [ ] **Step 3: Verify it typechecks and lints**

Run: `bun run check-types && bun run lint`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/place/ReportCard.tsx
git commit -m "feat(mobile): add ReportCard, the first surface that shows a report

Author display name, relative time, summary and attribute chips, plus
the verify control. Your own report is labelled as such, which is also
what drives the control's disabled state.

Attribute keys are shortened to their leaf ('mobility.elevator' ->
'elevator') because the four category groupings are already implied by
the surrounding filter and the full dotted key wraps badly at 200% font
scale."
```

---

### Task 7: Reports screen and route

**Files:**

- Move: `apps/mobile/app/place/[id].tsx` → `apps/mobile/app/place/[id]/index.tsx`
- Create: `apps/mobile/app/place/[id]/reports.tsx`
- Modify: `apps/mobile/app/place/[id]/index.tsx`

**Interfaces:**

- Consumes: `api.reports.listForPlace`, `api.users.currentUser`, `ReportCard` from Task 6
- Produces: route `/place/[id]/reports`

- [ ] **Step 1: Move the route file**

```bash
mkdir -p "apps/mobile/app/place/[id]"
git mv "apps/mobile/app/place/[id].tsx" "apps/mobile/app/place/[id]/index.tsx"
```

`/place/[id]` still resolves to the same component. Nothing inside the file changes as a result of the move — no import in it is route-relative.

- [ ] **Step 2: Create the reports screen**

Create `apps/mobile/app/place/[id]/reports.tsx`:

```tsx
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AccessibilityInfo, FlatList, StyleSheet, View } from "react-native";

import { ReportCard, type PlaceReport } from "@/components/place/ReportCard";
import { applyVerdictChange } from "@/components/place/verification-tally";
import {
  classifyVerificationError,
  verificationErrorMessage,
} from "@/components/place/verification-errors";
import type { Verdict } from "@/components/place/verification-tally";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

/**
 * US-10 — every active report on a place, each independently verifiable.
 *
 * The first screen in the app that shows reports as records rather than as a
 * count and a flattened aggregate, which is what verification requires.
 */
export default function PlaceReportsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const placeId = id as Id<"places"> | undefined;
  const currentUser = useQuery(api.users.currentUser);
  const reports = useQuery(
    api.reports.listForPlace,
    placeId ? { placeId } : "skip",
  );

  const verifyReport = useMutation(
    api.verifications.verifyReport,
  ).withOptimisticUpdate((store, args) => {
    if (!placeId) return;
    const cached = store.getQuery(api.reports.listForPlace, { placeId });
    if (!cached) return;
    store.setQuery(
      api.reports.listForPlace,
      { placeId },
      cached.map((report) =>
        report._id === args.reportId
          ? {
              ...report,
              ...applyVerdictChange(
                {
                  confirmCount: report.confirmCount,
                  disputeCount: report.disputeCount,
                  myVerdict: report.myVerdict,
                },
                args.verdict,
              ),
            }
          : report,
      ),
    );
  });

  const handleVote = async (reportId: string, verdict: Verdict) => {
    // Clear any prior failure so a later success does not leave a stale
    // banner: the user has moved on and the old error no longer applies.
    setError(null);
    try {
      await verifyReport({ reportId: reportId as Id<"reports">, verdict });
      // After the await, not before: the optimistic patch is already visible
      // and the tally text is what changed, so that is what to announce.
      AccessibilityInfo.announceForAccessibility(
        verdict === "confirm" ? "Report confirmed." : "Report disputed.",
      );
    } catch (caught) {
      const message = verificationErrorMessage(
        classifyVerificationError(caught),
      );
      AccessibilityInfo.announceForAccessibility(message);
      // Surfaced inline rather than in an alert so it sits next to the
      // control the user just pressed.
      setError(message);
    }
  };

  if (reports === undefined) {
    return (
      <>
        <Stack.Screen options={{ title: "Reports" }} />
        <Screen>
          <View style={styles.centered}>
            <AppText style={{ color: colors.textMuted }}>
              Loading reports…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Reports" }} />
      <Screen>
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <AppText variant="title" accessibilityRole="header">
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </AppText>
          }
          ListEmptyComponent={
            <AppText style={{ color: colors.textMuted }}>
              No reports on this place yet.
            </AppText>
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item as PlaceReport}
              currentUserId={currentUser?._id}
              onVote={(reportId, verdict) => void handleVote(reportId, verdict)}
            />
          )}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
```

- [ ] **Step 3: Fix the deliberate mistakes in the block above**

Two are intentional trip hazards. Correct them:

1. `setError` is called but never declared. Add `const [error, setError] = useState<string | null>(null);` after the `useAppTheme()` call, import `useState` from `"react"` — **not** from `react-native`, which does not re-export it in React Native 0.86 — and render the banner in the `FlatList`'s `ListHeaderComponent` above the count:
   ```tsx
   {
     error ? (
       <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
         {error}
       </AppText>
     ) : null;
   }
   ```
2. `router` is destructured from `useRouter()` but never used **in the brief's own snippet**. Remove
   `router` from the destructure, keeping `useRouter` in the `expo-router` import — because the
   signed-out branch added in Step 5 needs it for `router.replace("/sign-in")`. If you have already
   added that branch, keep both the hook and the binding.

- [ ] **Step 4: Link to it from the place detail**

In `apps/mobile/app/place/[id]/index.tsx`, the report-count badge at roughly line 150 is currently a plain `View`. Wrap its contents in a `TouchTarget` that navigates, and add the import.

Add to the imports:

```ts
import { useRouter } from "expo-router";
import { TouchTarget } from "@/components/ui/touch-target";
```

Inside the component, after the existing hooks:

```ts
const router = useRouter();
```

Replace the wrapping `<View style={[styles.countBadge, { backgroundColor: appTheme.colors.primary + "20" }]}>` and its closing `</View>` with:

```tsx
<TouchTarget
  accessibilityRole="link"
  accessibilityLabel={`${place.reportCount} ${
    place.reportCount === 1 ? "report" : "reports"
  } on this place`}
  accessibilityHint="Opens the list of reports so you can confirm or dispute them"
  focusColor={appTheme.colors.onPrimary}
  onPress={() =>
    router.push({ pathname: "/place/[id]/reports", params: { id: place._id } })
  }
  style={[
    styles.countBadge,
    { backgroundColor: appTheme.colors.primary + "20" },
  ]}
>
  <AppText
    variant="label"
    style={{ color: appTheme.colors.primary, fontSize: 12 }}
  >
    {place.reportCount} {place.reportCount === 1 ? "report" : "reports"}
  </AppText>
</TouchTarget>
```

If `useRouter` is already imported in that file, do not add the import again.

- [ ] **Step 5: Verify routes resolve and everything typechecks**

```bash
cd apps/mobile && npx expo customize tsconfig.json >/dev/null 2>&1 || true
bunx vitest run
cd ../.. && bun run check-types && bun run lint
```

Expected: mobile tests pass, both root checks succeed.

Then confirm the route table knows the new screen:

```bash
grep -c "place/\[id\]/reports\|place/\[id\]" apps/mobile/.expo/types/router.d.ts
```

Expected: at least 2 matches. If zero, start Metro once (`npx expo start`) to regenerate the typed routes, then re-run `check-types`.

- [ ] **Step 6: Commit**

```bash
git add -A apps/mobile/app/place
git commit -m "feat(mobile): add the reports screen and link it from the place detail

/place/[id]/reports lists every active report on a place with a verify
control each, which is the first surface in the app where a report is
shown as a record rather than a count.

app/place/[id].tsx moves to app/place/[id]/index.tsx so the route can
have a child; /place/[id] resolves to the same component either way and
git records it as a rename.

Votes patch the listForPlace cache optimistically using the same
arithmetic the server applies, so the tally the user sees is the tally
that settles. The vote outcome is announced after the await, since the
patch is already visible by then and the tally is what changed."
```

---

### Task 8: Traceability and full verification

**Files:**

- Modify: `docs/traceability.md`

**Interfaces:**

- Consumes: nothing — this task only records what Tasks 1–7 built
- Produces: the US-10 traceability row and six manual checklist items, which is what the Definition of Done in the spec is checked against

- [ ] **Step 1: Add the US-10 row**

Find the story table in `docs/traceability.md` and add a row in the same shape as the existing US-08 row:

```markdown
| US-10 | `verifications.test.ts` 10 backend cases; `verification-tally`, `verification-errors`, `format-relative-time` pure modules fully covered by Vitest | `VerifyControl` and `ReportCard` have no automated coverage — `apps/mobile` has no component renderer — so the screen is verified by the manual checklist below; the vote path is covered indirectly through the pure tally module |
```

- [ ] **Step 2: Add the manual checklist items**

Append to the manual verification checklist section:

```markdown
- [ ] A signed-in user can confirm and dispute another user's report, and change their mind
- [ ] A second signed-in user sees the first user's vote with no manual refresh
- [ ] Your own report shows disabled controls with a visible reason, and voting on it via any client is rejected
- [ ] No author email address appears in any reports response
- [ ] The reports list length matches the `N reports` badge on the place detail
- [ ] VerifyControl passes screen reader, 200% font scale, and 44×44 dp checks
```

- [ ] **Step 3: Run every check the repo has**

```bash
bun run check-types
bun run lint
bunx prettier --check $(git ls-files '*.ts' '*.tsx' '*.md' '*.json' | tr '\n' ' ')
cd packages/backend && bunx vitest run
cd ../../apps/mobile && bunx vitest run
```

Expected: all succeed. For the prettier line, if the untracked docs in `docs/` are reported, that is expected — they are not in git and CI does not see them.

- [ ] **Step 4: Confirm the Mapbox change is still uncommitted**

```bash
git status --short
git diff --stat -- 'apps/mobile/app/(tabs)/mapbox/index.tsx'
```

Expected: `apps/mobile/app/(tabs)/mapbox/index.tsx` still shows as modified, and `git log --oneline -5 --name-only | grep -c "mapbox/index.tsx"` returns 0.

- [ ] **Step 5: Commit**

```bash
git add docs/traceability.md
git commit -m "docs(us-10): add the traceability row and manual checklist

Records honestly that VerifyControl and ReportCard have no automated
coverage, because apps/mobile has no component renderer, rather than
letting the test count imply they are covered."
```

---

## Self-Review

**Spec coverage** — every section of `docs/plans/US-10-confirm-or-dispute-a-report.md` maps to a task:

| Spec section                                                        | Task                                     |
| ------------------------------------------------------------------- | ---------------------------------------- |
| `verifyReport`, guard ordering, self-verification, upsert, note cap | 1                                        |
| `forReport` shape for US-11                                         | 2                                        |
| `listForPlace`, active-only, ordering, no email, grouped tallies    | 3                                        |
| `VerifyControl`, disabled-with-reason, tally as one text node       | 5                                        |
| `ReportCard`                                                        | 6                                        |
| Screen, route move, optimistic patch, announce-after-await          | 7                                        |
| Error handling table                                                | 4 (`verification-errors.ts`)             |
| Accessibility requirements                                          | 5, and checklist in 8                    |
| Backend test list (10 items)                                        | 1 (6) + 2 (4)                            |
| Subtask coverage table                                              | 1–3, 5–7                                 |
| Risks: route collision, S3-7 wording                                | Noted in 7's commit message and the spec |
| Definition of done                                                  | 8                                        |

**Placeholder scan** — no `TBD`/`TODO`. Three deliberate defects are planted and each has a matching repair step: a fake `Id` cast in Task 1 Step 2, `totalVotesOf` in Task 4 Step 1, and `onPress`/`radii` in Task 6 plus `setError`/`router` in Task 7. Each is called out explicitly in the step that follows, so an executor cannot ship them.

**Type consistency** — `VerificationTally`, `Verdict`, `PlaceReport`, `applyVerdictChange`, `tallySummary`, `isOwnReport`, `VerificationErrorKind` are defined once in Task 4 and consumed by that name in Tasks 5, 6 and 7. `VerifyControl`'s prop type is `{ reportId, tally, disabled, disabledReason, onVote }` in both its definition (Task 5) and its use (Task 6).
