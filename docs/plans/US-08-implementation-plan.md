# US-08 Submit an Accessibility Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user submit an accessibility report for a place through a four-step form, with server-side auth, validation, and a 24-hour duplicate guard.

**Architecture:** One new Convex mutation `api.reports.submitReport` writes a `reports` document, guarded by `getAuthUserId` plus seven validation rules including an indexed 24-hour duplicate check. One new Expo Router screen drives a four-step wizard held in a pure reducer; the final step fires one `useMutation().withOptimisticUpdate` that patches the already-cached `api.places.getPlace` so Convex's automatic revert provides rollback.

**Tech Stack:** Convex 1.27 (`@convex-dev/auth` Password provider, `convex-test` 0.0.55), Expo SDK 57 / React Native 0.86 / expo-router 7 (`typedRoutes: true`, `reactCompiler: true`), TypeScript 5.8 (`noUncheckedIndexedAccess` in the backend only), Bun 1.3 workspaces + Turborepo, Vitest 4.1.10, ESLint 9 + Prettier (80 col).

**Spec:** `docs/plans/US-08-submit-an-accessibility-report.md` — read it before starting; this plan implements it and cites its section numbers.

## Global Constraints

- **Never add a second label map.** Attribute labels come from `ATTRIBUTE_METADATA` in `apps/mobile/constants/accessibility-metadata.ts`; values from `VALUE_LABELS`; emoji from `ATTRIBUTE_ICON_EMOJI`. Attribute _keys_ come from `ACCESSIBILITY_ATTRIBUTE_KEYS` in `packages/backend/convex/accessibility.ts`. Do not introduce the obsolete nine-value vocabulary from `PRD:103` (`ramp`, `accessible WC`, …).
- **No new npm dependencies** in either workspace. Every primitive used by the UI already exists: `Screen`, `AppText`, `TouchTarget`, `CheckboxRow`, `AttributeRow`, theme tokens.
- **`authorId` is never a mutation argument.** It comes only from `await getAuthUserId(ctx)`.
- **Every user-facing string is plain language.** Server error strings are developer-facing; the client maps them to user copy via `classifyReportError`. Do not render a raw server message to the user.
- **Icons are never icon-only.** Every emoji is paired with a visible text label.
- **Every interactive element goes through `TouchTarget`**, which enforces the 44pt minimum and merges `disabled` into `accessibilityState`.
- **Every state change calls `AccessibilityInfo.announceForAccessibility`.** Errors additionally render in an `accessibilityRole="alert"` banner.
- **State is never signalled by colour alone** — pair colour with text (WCAG 1.4.1).
- **`noUncheckedIndexedAccess` is on in `packages/backend` only.** Verified with `tsc --showConfig`: backend `true`, mobile unset (it extends `expo/tsconfig.base` and sets only `strict`). So in backend code, array indexing yields `T | undefined` and `arr[0]?.field` / `for…of` are required. In mobile code the `?? ""` and `?.length ?? 0` fallbacks are **defensive, not type-checker-mandated** — keep them anyway, since a runtime `undefined` is real regardless of the flag, but do not assume `tsc` will catch an unguarded index in `apps/mobile`. Enabling the flag there is out of scope for this story.
- **Prettier:** 80 columns, double quotes, semicolons, trailing commas. The pre-commit hook runs `prettier --write`, `bun run lint`, and `bun run check-types` on every commit — all three must pass before a commit succeeds.
- **Commit dates are pinned to 18 Sep 2026** (Sprint 3 window). Prefix every commit with:
  `GIT_AUTHOR_DATE="2026-09-18T<HH:MM>:00+05:30" GIT_COMMITTER_DATE="2026-09-18T<HH:MM>:00+05:30"`, using a distinct increasing time per commit (suggested: 11:00, 11:45, 12:30, 13:15, 14:00, 15:00, 16:00, 17:00).

## File Structure

**Backend — new**

| File                                      | Responsibility                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/convex/reportLimits.ts` | Pure numeric limits shared by the mutation and the mobile UI. No imports, no I/O — mirrors the existing `notificationPolicy.ts` / `verificationNeed.ts` pure-lib pattern. |
| `packages/backend/convex/reports.ts`      | The `submitReport` mutation and its private `assertNoDuplicateKeys` helper. Nothing else.                                                                                 |
| `packages/backend/convex/reports.test.ts` | 18 `convex-test` cases covering every guard. 13 landed in Tasks 1–3; the later fix wave added 5. The spec's §Changes 3 list of 11 is a subset.                            |

**Backend — modified**

| File                                          | Change                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/backend/convex/schema.ts`           | Add `.index("by_place_and_author", ["placeId", "authorId"])` to `reports`. |
| `packages/backend/convex/_generated/api.d.ts` | Register the new `reports` module (two edits — see Task 1).                |

**Mobile — new**

| File                                                  | Responsibility                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/components/report/report-draft.ts`       | Pure types, reducer, and selectors for wizard state. No React import, so Vitest can test it with no renderer. |
| `apps/mobile/components/report/report-draft.test.ts`  | Reducer and selector tests.                                                                                   |
| `apps/mobile/components/report/report-errors.ts`      | Maps a thrown mutation error to a `ReportErrorKind` and a plain-language message.                             |
| `apps/mobile/components/report/report-errors.test.ts` | Classification tests.                                                                                         |
| `apps/mobile/components/report/StepIndicator.tsx`     | "Step 2 of 4 — Attributes" header with a `progressbar` role.                                                  |
| `apps/mobile/components/report/CategoryStep.tsx`      | Step 1 — pick one of six attribute groups.                                                                    |
| `apps/mobile/components/report/AttributesStep.tsx`    | Step 2 — pick a value per attribute, annotate inline.                                                         |
| `apps/mobile/components/report/NotesStep.tsx`         | Step 3 — the report summary.                                                                                  |
| `apps/mobile/components/report/ConfirmStep.tsx`       | Step 4 — read-only recap and submit.                                                                          |
| `apps/mobile/app/report/[placeId].tsx`                | The wizard route: state ownership, navigation, mutation, optimistic update.                                   |

**Mobile — modified**

| File                             | Change                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| `apps/mobile/package.json`       | Add `test` script and `vitest` devDependency.                 |
| `bun.lock`                       | Regenerated by `bun install`.                                 |
| `apps/mobile/app/_layout.tsx`    | Register the `report/[placeId]` stack screen.                 |
| `apps/mobile/app/place/[id].tsx` | Replace the `onContribute` no-op with a real navigation call. |

**Docs — new**

| File                   | Change                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `docs/traceability.md` | Does not exist. Create it with the US-08 row plus the new index. |

**Interface contract between tasks** — every task below depends on these exact names:

```ts
// convex/reportLimits.ts
export const MAX_SUMMARY_LENGTH = 500;
export const MAX_NOTE_LENGTH = 280;
export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
export const MAX_OBSERVATION_AGE_MS = 365 * 24 * 60 * 60 * 1000;

// convex/reports.ts
export const submitReport: Mutation<
  {
    placeId: Id<"places">;
    attributes: AccessibilityAttribute[];
    summary?: string;
    observedAt: number;
  },
  Promise<ReportDoc | null>
>;

// components/report/report-draft.ts
export const REPORT_STEPS: readonly [
  "category",
  "attributes",
  "notes",
  "confirm",
];
export const REPORT_ATTRIBUTE_VALUES: readonly [
  "yes",
  "no",
  "partial",
  "unknown",
  "not_applicable",
];
export type ReportDraft = {
  step: number;
  category: string | null;
  selected: Partial<
    Record<AccessibilityAttributeKey, AccessibilityAttributeValue>
  >;
  notes: Partial<Record<AccessibilityAttributeKey, string>>;
  summary: string;
};
export type DraftAction =
  | { type: "chooseCategory"; category: string }
  | {
      type: "setValue";
      key: AccessibilityAttributeKey;
      value: AccessibilityAttributeValue;
    }
  | { type: "clearValue"; key: AccessibilityAttributeKey }
  | { type: "setNote"; key: AccessibilityAttributeKey; note: string }
  | { type: "setSummary"; summary: string }
  | { type: "goToStep"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "reset" };
export const emptyDraft: ReportDraft;
export function reportReducer(
  state: ReportDraft,
  action: DraftAction,
): ReportDraft;
export function selectedAttributes(
  draft: ReportDraft,
): AccessibilityAttribute[];
export function missingRequiredNotes(
  draft: ReportDraft,
): AccessibilityAttributeKey[];
export function canAdvance(draft: ReportDraft): boolean;

// components/report/report-errors.ts
export type ReportErrorKind =
  | "duplicate"
  | "unauthenticated"
  | "summaryTooLong"
  | "observationTime"
  | "generic";
export function classifyReportError(error: unknown): ReportErrorKind;
export function reportErrorMessage(kind: ReportErrorKind): string;
```

---

### Task 1: Schema index, module scaffold, and the auth gate

**Files:**

- Modify: `packages/backend/convex/schema.ts` (the `reports` table, index chain)
- Modify: `packages/backend/convex/_generated/api.d.ts` (two insertions)
- Create: `packages/backend/convex/reportLimits.ts`
- Create: `packages/backend/convex/reports.ts`
- Create: `packages/backend/convex/reports.test.ts`

**Interfaces:**

- Consumes: `ACCESSIBILITY_TAXONOMY_VERSION`, `accessibilityAttributeValidator`, `AccessibilityAttribute`, `AccessibilityAttributeKey` from `./accessibility`.
- Produces: the `submitReport` mutation and the five constants in `reportLimits.ts`, consumed by Tasks 2, 3, 4, 8.

- [ ] **Step 1: Add the compound index to the schema**

In `packages/backend/convex/schema.ts`, the `reports` table currently ends with:

```ts
    status: reportStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_author", ["authorId"]),
```

Add a third index so the 24-hour guard is one indexed read (spec §"Resolved ambiguities" #3):

```ts
    status: reportStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_author", ["authorId"])
    .index("by_place_and_author", ["placeId", "authorId"]),
```

- [ ] **Step 2: Register the new module in the generated API surface**

`convex codegen` cannot run — there is no `.env` and `CONVEX_URL` is unset, so there is no deployment to generate against. `_generated/` is committed precisely so a fresh clone typechecks without one, so hand-edit it. This mirrors what codegen would emit.

In `packages/backend/convex/_generated/api.d.ts`, the imports are alphabetical. Insert `reports` between `pushTokens` and `users`:

```ts
import type * as pushTokens from "../pushTokens.js";
import type * as reports from "../reports.js";
import type * as users from "../users.js";
```

And add the member to `ApiFromModules`, same alphabetical position:

```ts
places: typeof places;
pushTokens: typeof pushTokens;
reports: typeof reports;
users: typeof users;
```

Leave the `/* eslint-disable */` header and the `components` block untouched.

- [ ] **Step 3: Create the shared limits module**

Create `packages/backend/convex/reportLimits.ts`. It has no imports so that `apps/mobile` can import it as a plain value module without pulling in `convex/server`:

```ts
/**
 * Limits shared by the report submission mutation and the report form UI.
 *
 * No imports and no I/O on purpose: the mutation enforces these and the
 * wizard needs the same numbers for its character counter and `maxLength`,
 * so both sides read them from here rather than hard-coding two copies that
 * can drift apart.
 */

/** Maximum characters in a report's overall `summary`. */
export const MAX_SUMMARY_LENGTH = 500;

/** Maximum characters in a single attribute's `note`. */
export const MAX_NOTE_LENGTH = 280;

/** A user may report on the same place at most once per this window. */
export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** How far ahead of server time a client clock may claim to have observed. */
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** How far back a report may claim to have been observed. */
export const MAX_OBSERVATION_AGE_MS = 365 * 24 * 60 * 60 * 1000;
```

- [ ] **Step 4: Write the failing tests**

Create `packages/backend/convex/reports.test.ts`. The `import.meta.glob("./**/*.*s")` pattern is deliberate — the `*.*s` suffix matches `.ts` and `.js` while excluding `.test.ts`. It is required for the test to resolve `./accessibility` and `./reportLimits`.

```ts
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

async function seedAuthor(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email: "author@example.com",
      displayName: "Report Author",
      role: "member",
      updatedAt: 1,
    });
    const placeId = await ctx.db.insert("places", {
      name: "Community Library",
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: userId,
      updatedAt: 1,
    });
    return { userId, placeId };
  });
}

const validAttribute = {
  key: "mobility.step_free_entrance" as const,
  value: "yes" as const,
};

describe("US-08 report submission", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedAuthor(t);

    await expect(
      t.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("persists a report and derives the author from the session", async () => {
    const t = convexTest(schema, modules);
    const { userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const observedAt = Date.now();

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [
        validAttribute,
        { key: "mobility.elevator", value: "partial", note: "Keypad is tall." },
      ],
      summary: "Library entrance is step free.",
      observedAt,
    });

    expect(created?.authorId).toBe(userId);
    expect(created?.placeId).toBe(placeId);
    expect(created?.taxonomyVersion).toBe(1);
    expect(created?.status).toBe("active");
    expect(created?.summary).toBe("Library entrance is step free.");
    expect(created?.observedAt).toBe(observedAt);
    expect(created?.evidence).toEqual([]);
    expect(created?.attributes).toHaveLength(2);

    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("reports")
        .withIndex("by_place_and_author", (q) =>
          q.eq("placeId", placeId).eq("authorId", userId),
        )
        .collect(),
    );
    expect(stored).toHaveLength(1);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: FAIL. `api.reports` is registered in the type surface but `reports.ts` does not exist yet, so the module glob cannot resolve it — the failure will be a module-resolution or "submitReport is not a function" error, not an assertion failure. That is the correct red state for this step.

- [ ] **Step 6: Write the minimal implementation**

Create `packages/backend/convex/reports.ts`. This step implements **only** the auth gate and the insert — the seven validation rules are Tasks 2 and 3, added test-first.

```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeValidator,
} from "./accessibility";

/**
 * US-08 — submit an accessibility report for a place.
 *
 * The author is taken from the session and is deliberately not an argument:
 * a client-supplied authorId would let anyone file reports as any user.
 * Convex functions are public endpoints, so the `getAuthUserId` guard is
 * the only thing standing between the deployment URL and open write access.
 *
 * Validation and the 24-hour duplicate guard are applied in the handler
 * below, after the auth check, cheapest and most security-relevant first.
 */
export const submitReport = mutation({
  args: {
    placeId: v.id("places"),
    attributes: v.array(accessibilityAttributeValidator),
    summary: v.optional(v.string()),
    observedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to submit a report");
    }

    const place = await ctx.db.get(args.placeId);
    if (!place) {
      throw new Error(`Unknown place: ${args.placeId}`);
    }

    const reportId = await ctx.db.insert("reports", {
      placeId: args.placeId,
      authorId: userId,
      taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
      attributes: args.attributes,
      summary: args.summary,
      evidence: [],
      observedAt: args.observedAt,
      status: "active",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(reportId);
  },
});
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: PASS, 2 tests.

- [ ] **Step 8: Run the full backend suite for regressions**

Run: `cd packages/backend && bunx vitest run`

Expected: PASS. The `schema.test.ts` insert graph is unaffected by the additive index.

- [ ] **Step 9: Commit**

```bash
git add packages/backend/convex/schema.ts \
        packages/backend/convex/_generated/api.d.ts \
        packages/backend/convex/reportLimits.ts \
        packages/backend/convex/reports.ts \
        packages/backend/convex/reports.test.ts
GIT_AUTHOR_DATE="2026-09-18T11:00:00+05:30" GIT_COMMITTER_DATE="2026-09-18T11:00:00+05:30" \
  git commit -m "feat(us-08): add submitReport mutation with auth gate

Adds the by_place_and_author compound index so the 24-hour duplicate
guard is a single indexed read rather than an unbounded by_author scan.

reportLimits.ts holds the shared limits with no imports, so both the
mutation and the mobile form read the same numbers instead of keeping
two copies that can drift.

_generated/api.d.ts is hand-edited: convex codegen needs a deployment and
this repo has no CONVEX_URL, and _generated is committed so a fresh clone
typechecks without one.

Refs US-08"
```

---

### Task 2: Input validation guards

**Files:**

- Modify: `packages/backend/convex/reports.ts`
- Modify: `packages/backend/convex/reports.test.ts`

**Interfaces:**

- Consumes: `MAX_SUMMARY_LENGTH`, `MAX_NOTE_LENGTH` from `./reportLimits`; `AccessibilityAttribute`, `AccessibilityAttributeKey` from `./accessibility`.
- Produces: the guard set and the exact error strings listed below, which Task 8's `classifyReportError` matches on. **These strings are a contract — do not reword them without updating Task 8's tests in the same commit.**

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe("US-08 report submission")` block in `packages/backend/convex/reports.test.ts`:

```ts
test("rejects an empty attributes array", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Add at least one accessibility attribute");
});

test("rejects duplicate attribute keys", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [
        validAttribute,
        { key: "mobility.step_free_entrance", value: "no" },
      ],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Duplicate accessibility attribute");
});

test("rejects a summary over the cap", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      summary: "x".repeat(501),
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Summary too long");
});

test("accepts a summary exactly at the cap", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });
  const summary = "x".repeat(500);

  const created = await asUser.mutation(api.reports.submitReport, {
    placeId,
    attributes: [validAttribute],
    summary,
    observedAt: Date.now(),
  });

  expect(created?.summary).toBe(summary);
});

test("rejects a per-attribute note over the cap", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [
        { key: "mobility.elevator", value: "partial", note: "x".repeat(281) },
      ],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Note too long");
});

test("rejects a place that does not exist", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  // Convex validates `v.id("places")` as a well-formed id, not as a row
  // that still exists, so a deleted row is the only way to reach the
  // handler's existence check.
  const ghostPlaceId = await t.run(async (ctx) => {
    const ghost = await ctx.db.insert("places", {
      name: "Ghost Place",
      category: "other",
      address: "Nowhere",
      location: { latitude: 6.9, longitude: 79.8 },
      createdBy: userId,
      updatedAt: 1,
    });
    await ctx.db.delete(ghost);
    return ghost;
  });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId: ghostPlaceId,
      attributes: [validAttribute],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Unknown place");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: FAIL on 4 of the new cases — the empty-array, duplicate-key, summary-cap, and note-cap cases will all currently succeed in inserting, so each fails on `.rejects`. The at-the-cap and unknown-place cases will already pass, because there is no cap logic yet and the `Unknown place` guard landed in Task 1.

- [ ] **Step 3: Add the guards to the mutation**

In `packages/backend/convex/reports.ts`, add the import:

```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeValidator,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
} from "./accessibility";
import { MAX_NOTE_LENGTH, MAX_SUMMARY_LENGTH } from "./reportLimits";
```

Insert these guards between the `Unknown place` check and the `ctx.db.insert` call:

```ts
if (args.attributes.length === 0) {
  throw new Error("Add at least one accessibility attribute");
}

assertNoDuplicateKeys(args.attributes);

if (args.summary !== undefined && args.summary.length > MAX_SUMMARY_LENGTH) {
  throw new Error(
    `Summary too long: ${args.summary.length} characters, maximum ${MAX_SUMMARY_LENGTH}`,
  );
}

for (const attribute of args.attributes) {
  if (attribute.note !== undefined && attribute.note.length > MAX_NOTE_LENGTH) {
    throw new Error(
      `Note too long: ${attribute.note.length} characters, maximum ${MAX_NOTE_LENGTH}`,
    );
  }
}
```

Then append the private helper at the bottom of the file, after the mutation:

```ts
/**
 * The validator guarantees every key is a known attribute, but not that the
 * list is a set. A repeated key would double-count in the last-write-wins
 * aggregation `places.getPlace` performs, so reject it at the boundary.
 *
 * This mirrors `assertNoDuplicateNeeds` in `users.ts`, which enforces the
 * same invariant for the profile's accessibility needs.
 */
function assertNoDuplicateKeys(attributes: AccessibilityAttribute[]) {
  const seen = new Set<AccessibilityAttributeKey>();
  for (const attribute of attributes) {
    if (seen.has(attribute.key)) {
      throw new Error(`Duplicate accessibility attribute: ${attribute.key}`);
    }
    seen.add(attribute.key);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/convex/reports.ts packages/backend/convex/reports.test.ts
GIT_AUTHOR_DATE="2026-09-18T11:45:00+05:30" GIT_COMMITTER_DATE="2026-09-18T11:45:00+05:30" \
  git commit -m "feat(us-08): validate report attributes, notes, and summary

Rejects an empty attribute list, duplicate attribute keys, and notes or
summaries over their caps. The duplicate-key check mirrors
assertNoDuplicateNeeds in users.ts, since a repeated key would
double-count in the last-write-wins aggregation getPlace performs.

Caps live in reportLimits.ts so the mobile form's character counter and
maxLength read the same numbers the mutation enforces.

Refs US-08"
```

---

### Task 3: Clock-skew and 24-hour duplicate guards

**Files:**

- Modify: `packages/backend/convex/reports.ts`
- Modify: `packages/backend/convex/reports.test.ts`

**Interfaces:**

- Consumes: `DUPLICATE_WINDOW_MS`, `MAX_CLOCK_SKEW_MS`, `MAX_OBSERVATION_AGE_MS` from `./reportLimits`.
- Produces: the `Duplicate report:` error string, which Task 8's `classifyReportError` matches on.

- [ ] **Step 1: Write the failing tests**

The 24-hour guard reads the real server clock — there is deliberately no `now` argument, because a client-settable clock would be a bypass of the abuse control (spec §"One deliberate deviation"). Tests therefore control the _existing_ report's `updatedAt` by inserting it directly, because `updatedAt` is what the window keys on: `observedAt` is client-supplied and guard 7 accepts it up to a year old, so a window keyed on it could be back-dated out of by the caller.

Append inside the `describe` block in `packages/backend/convex/reports.test.ts`:

```ts
test("rejects an observedAt beyond the forward clock-skew tolerance", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      observedAt: Date.now() + 10 * 60 * 1000,
    }),
  ).rejects.toThrow("Observation time is outside the allowed range");
});

test("accepts an observedAt inside the forward clock-skew tolerance", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });
  const observedAt = Date.now() + 60 * 1000;

  const created = await asUser.mutation(api.reports.submitReport, {
    placeId,
    attributes: [validAttribute],
    observedAt,
  });

  expect(created?.observedAt).toBe(observedAt);
});

test("rejects a second report on the same place within 24 hours", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await asUser.mutation(api.reports.submitReport, {
    placeId,
    attributes: [validAttribute],
    observedAt: Date.now() - 60 * 1000,
  });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Duplicate report");
});

test("allows a new report once the previous one is older than 24 hours", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  await t.run(async (ctx) => {
    await ctx.db.insert("reports", {
      placeId,
      authorId: userId,
      taxonomyVersion: 1,
      attributes: [validAttribute],
      evidence: [],
      observedAt: Date.now() - 25 * 60 * 60 * 1000,
      status: "active",
      updatedAt: Date.now() - 25 * 60 * 60 * 1000,
    });
  });

  const created = await asUser.mutation(api.reports.submitReport, {
    placeId,
    attributes: [{ key: "mobility.elevator", value: "yes" }],
    observedAt: Date.now(),
  });

  expect(created).not.toBeNull();
});

test("ignores a removed prior report when applying the 24 hour guard", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  // Filed a minute ago, so only the status filter can let this through.
  await t.run(async (ctx) => {
    await ctx.db.insert("reports", {
      placeId,
      authorId: userId,
      taxonomyVersion: 1,
      attributes: [validAttribute],
      evidence: [],
      observedAt: Date.now() - 60 * 1000,
      status: "removed",
      updatedAt: Date.now() - 60 * 1000,
    });
  });

  const created = await asUser.mutation(api.reports.submitReport, {
    placeId,
    attributes: [{ key: "mobility.elevator", value: "yes" }],
    observedAt: Date.now(),
  });

  expect(created).not.toBeNull();
});

test("rejects a repeat report even when the prior one back-dates observedAt", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  // The prior report claims to have been observed 25 hours ago, but it was
  // FILED a minute ago. Keying the duplicate window on observedAt would let
  // this through; keying it on updatedAt does not.
  await t.run(async (ctx) => {
    await ctx.db.insert("reports", {
      placeId,
      authorId: userId,
      taxonomyVersion: 1,
      attributes: [validAttribute],
      evidence: [],
      observedAt: Date.now() - 25 * 60 * 60 * 1000,
      status: "active",
      updatedAt: Date.now() - 60 * 1000,
    });
  });

  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      observedAt: Date.now(),
    }),
  ).rejects.toThrow("Duplicate report:");
});

test("rejects a NaN observedAt", async () => {
  const t = convexTest(schema, modules);
  const { userId, placeId } = await seedAuthor(t);
  const asUser = t.withIdentity({ subject: userId });

  // Both range comparisons are false for NaN, so without an explicit
  // finiteness check this value would pass guard 7 and be stored.
  await expect(
    asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      observedAt: Number.NaN,
    }),
  ).rejects.toThrow("Observation time is outside the allowed range");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: FAIL on 5 of the 7 new cases — the forward-skew rejection, the NaN rejection and all three duplicate rejections have no guard yet. The "accepts inside tolerance", "older than 24 hours" and "ignores removed report" cases will pass because nothing blocks them yet.

- [ ] **Step 3: Add the guards to the mutation**

Extend the `reportLimits` import in `packages/backend/convex/reports.ts`:

```ts
import {
  DUPLICATE_WINDOW_MS,
  MAX_CLOCK_SKEW_MS,
  MAX_NOTE_LENGTH,
  MAX_OBSERVATION_AGE_MS,
  MAX_SUMMARY_LENGTH,
} from "./reportLimits";
```

Insert both guards after the note-length loop and before `ctx.db.insert`:

```ts
const now = Date.now();

// `Number.isFinite` first: both range comparisons are false for NaN, so
// without it a NaN `observedAt` would pass guard 7 and be stored.
if (
  !Number.isFinite(args.observedAt) ||
  args.observedAt > now + MAX_CLOCK_SKEW_MS ||
  args.observedAt < now - MAX_OBSERVATION_AGE_MS
) {
  throw new Error("Observation time is outside the allowed range");
}

const cutoff = now - DUPLICATE_WINDOW_MS;
const recent = await ctx.db
  .query("reports")
  .withIndex("by_place_and_author", (q) =>
    q.eq("placeId", args.placeId).eq("authorId", userId),
  )
  // The predicate receives a `FilterBuilder`, not a document, so the
  // conditions are built from that builder and returned. A document-shaped
  // predicate is a TS2339 compile error which, because Vitest does not
  // type-check, transpiles into something matching nothing — a guard that
  // fails open.
  //
  // The window keys on `updatedAt`, the server clock value written at insert
  // time, so a caller cannot back-date `observedAt` past it and escape.
  .filter((q) =>
    q.and(
      q.eq(q.field("status"), "active"),
      q.gt(q.field("updatedAt"), cutoff),
    ),
  )
  .first();
if (recent) {
  throw new Error(
    "Duplicate report: you already reported on this place in the last 24 hours",
  );
}
```

Then change the insert's `updatedAt: Date.now()` to `updatedAt: now` so the document and the guard agree on the clock.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/backend && bunx vitest run reports.test.ts`

Expected: PASS, 18 tests in `reports.test.ts`.

- [ ] **Step 5: Run the full backend suite**

Run: `cd packages/backend && bunx vitest run`

Expected: PASS. `notifications.ts` reads `reports` through `by_place`, which is untouched.

- [ ] **Step 6: Commit**

```bash
git add packages/backend/convex/reports.ts packages/backend/convex/reports.test.ts
GIT_AUTHOR_DATE="2026-09-18T12:30:00+05:30" GIT_COMMITTER_DATE="2026-09-18T12:30:00+05:30" \
  git commit -m "feat(us-08): guard report timestamp and 24h duplicate window

Rejects an observedAt beyond a five-minute forward clock-skew tolerance or
older than a year, a non-finite one, and a second active report from the same
user on the same place inside 24 hours via the by_place_and_author index. The
duplicate window keys on the server-written updatedAt, not on the
client-supplied observedAt, so a caller cannot back-date past it.

The handler reads the real clock rather than accepting a `now` argument the
way notifications.sweep does: a client-settable clock would be a direct
bypass of the duplicate guard, which is an abuse control. Tests stay
deterministic by controlling the prior report's updatedAt directly.

The guard's atomicity rests on Convex's serializable transactions, which
retry automatically on conflict, so a losing submission re-reads and is
rejected. Convex has no unique indexes, so nothing in the schema enforces
that: rewriting this guard onto by_author, or splitting it into a separate
function, would lose the protection silently.

Refs US-08"
```

---

### Task 4: Pure wizard logic and error mapping

**Files:**

- Create: `apps/mobile/components/report/report-draft.ts`
- Create: `apps/mobile/components/report/report-draft.test.ts`
- Create: `apps/mobile/components/report/report-errors.ts`
- Create: `apps/mobile/components/report/report-errors.test.ts`
- Modify: `apps/mobile/package.json`
- Modify: `bun.lock`

**Interfaces:**

- Consumes: `ACCESSIBILITY_ATTRIBUTE_KEYS`, `AccessibilityAttribute`, `AccessibilityAttributeKey`, `AccessibilityAttributeValue` from `@packages/backend/convex/accessibility`; `MAX_SUMMARY_LENGTH` from `@packages/backend/convex/reportLimits`.
- Produces: every symbol in the "Interface contract" block above. Tasks 5–8 consume these and nothing else from this task.

Vitest runs inside `apps/mobile` with no config file — it resolves the hoisted root install. Adding it to `devDependencies` (rather than relying on hoisting) is what keeps `bun install --frozen-lockfile` honest in CI.

- [ ] **Step 1: Add the test script and vitest to apps/mobile**

In `apps/mobile/package.json`, add `"test": "vitest run"` to `scripts` (after `"lint"`) and `"vitest": "^4.1.10"` to `devDependencies`. Keep `devDependencies` alphabetically sorted. Then:

```bash
bun install
```

Expected: `bun install --frozen-lockfile` afterwards reports "no changes", confirming `bun.lock` is consistent.

- [ ] **Step 2: Write the failing draft-reducer tests**

Create `apps/mobile/components/report/report-draft.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  canAdvance,
  emptyDraft,
  missingRequiredNotes,
  reportReducer,
  selectedAttributes,
} from "./report-draft";

describe("reportReducer", () => {
  test("chooseCategory sets the group and does not move the step", () => {
    const next = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(next.category).toBe("Mobility");
    expect(next.step).toBe(0);
  });

  test("next advances one step", () => {
    const withCategory = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(reportReducer(withCategory, { type: "next" }).step).toBe(1);
  });

  test("back stops at the first step", () => {
    expect(reportReducer(emptyDraft, { type: "back" }).step).toBe(0);
  });

  test("next stops at the last step", () => {
    const atConfirm = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(reportReducer(atConfirm, { type: "next" }).step).toBe(3);
  });

  test("setValue records a value and clears any stale note", () => {
    const withNote = reportReducer(emptyDraft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Keypad is tall.",
    });
    const next = reportReducer(withNote, {
      type: "setValue",
      key: "mobility.elevator",
      value: "yes",
    });
    expect(next.selected["mobility.elevator"]).toBe("yes");
    expect(next.notes["mobility.elevator"]).toBeUndefined();
  });

  test("clearValue removes both the value and its note", () => {
    const selected = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    const noted = reportReducer(selected, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Keypad is tall.",
    });
    const cleared = reportReducer(noted, {
      type: "clearValue",
      key: "mobility.elevator",
    });
    expect(cleared.selected["mobility.elevator"]).toBeUndefined();
    expect(cleared.notes["mobility.elevator"]).toBeUndefined();
  });

  test("setSummary stores the report summary verbatim", () => {
    // Deliberately NOT trimmed: this value feeds a controlled TextInput, so
    // trimming here would strip a space as soon as it was typed and the user
    // could never enter two words. Trimming belongs at submit, not per keystroke.
    const next = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "  step free entrance  ",
    });
    expect(next.summary).toBe("  step free entrance  ");
  });

  test("setSummary preserves a trailing space so words can be separated", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "hello",
    });
    draft = reportReducer(draft, {
      type: "setSummary",
      summary: "hello ",
    });
    expect(draft.summary).toBe("hello ");
  });

  test("reset returns the empty draft", () => {
    const dirty = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "x",
    });
    expect(reportReducer(dirty, { type: "reset" })).toEqual(emptyDraft);
  });

  // The assertion above compares the returned object against the very object
  // `reset` returns, so it cannot detect aliasing. These can.
  test("goToStep clamps below the first step", () => {
    expect(reportReducer(emptyDraft, { type: "goToStep", step: -1 }).step).toBe(
      0,
    );
  });

  test("goToStep clamps above the last step", () => {
    const atFirst = reportReducer(emptyDraft, { type: "goToStep", step: 0 });
    expect(reportReducer(atFirst, { type: "goToStep", step: 99 }).step).toBe(3);
  });

  test("back steps back from the last step", () => {
    const atConfirm = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(reportReducer(atConfirm, { type: "back" }).step).toBe(2);
  });

  test("reset does not alias the emptyDraft singleton", () => {
    const dirty = reportReducer(emptyDraft, {
      type: "setSummary",
      summary: "x",
    });
    const reset = reportReducer(dirty, { type: "reset" });
    expect(reset.selected).not.toBe(emptyDraft.selected);
    expect(reset.notes).not.toBe(emptyDraft.notes);
  });
});

describe("selectedAttributes", () => {
  test("returns nothing when nothing is selected", () => {
    expect(selectedAttributes(emptyDraft)).toEqual([]);
  });

  test("returns attributes in taxonomy order regardless of selection order", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "vision.braille_signage",
      value: "yes",
    });
    draft = reportReducer(draft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    expect(selectedAttributes(draft).map((a) => a.key)).toEqual([
      "mobility.elevator",
      "vision.braille_signage",
    ]);
  });

  test("omits an empty note rather than storing an empty string", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "   ",
    });
    expect(selectedAttributes(draft)).toEqual([
      { key: "mobility.elevator", value: "no" },
    ]);
  });

  test("includes a non-empty note", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "No elevator at all.",
    });
    expect(selectedAttributes(draft)).toEqual([
      { key: "mobility.elevator", value: "no", note: "No elevator at all." },
    ]);
  });
});

describe("missingRequiredNotes", () => {
  test("is empty when no attribute is partial", () => {
    const draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "no",
    });
    expect(missingRequiredNotes(draft)).toEqual([]);
  });

  test("lists a partial attribute with no note", () => {
    const draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    expect(missingRequiredNotes(draft)).toEqual(["mobility.elevator"]);
  });

  test("treats a whitespace-only note as missing", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "   ",
    });
    expect(missingRequiredNotes(draft)).toEqual(["mobility.elevator"]);
  });

  test("is satisfied once the note has content", () => {
    let draft = reportReducer(emptyDraft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    draft = reportReducer(draft, {
      type: "setNote",
      key: "mobility.elevator",
      note: "Ramp only at the side entrance.",
    });
    expect(missingRequiredNotes(draft)).toEqual([]);
  });
});

describe("canAdvance", () => {
  test("blocks step one until a category is chosen", () => {
    expect(canAdvance(emptyDraft)).toBe(false);
  });

  test("allows step one once a category is chosen", () => {
    const draft = reportReducer(emptyDraft, {
      type: "chooseCategory",
      category: "Mobility",
    });
    expect(canAdvance(draft)).toBe(true);
  });

  test("blocks step two until at least one value is selected", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 1 });
    expect(canAdvance(draft)).toBe(false);
  });

  test("blocks step two while a partial attribute has no note", () => {
    let draft = reportReducer(emptyDraft, { type: "goToStep", step: 1 });
    draft = reportReducer(draft, {
      type: "setValue",
      key: "mobility.elevator",
      value: "partial",
    });
    expect(canAdvance(draft)).toBe(false);
  });

  test("allows step three unconditionally", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 2 });
    expect(canAdvance(draft)).toBe(true);
  });

  test("blocks the confirm step, which has no next", () => {
    const draft = reportReducer(emptyDraft, { type: "goToStep", step: 3 });
    expect(canAdvance(draft)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the draft tests to verify they fail**

Run: `cd apps/mobile && bunx vitest run components/report/report-draft.test.ts`

Expected: FAIL — cannot resolve `./report-draft`.

- [ ] **Step 4: Implement the draft reducer**

Create `apps/mobile/components/report/report-draft.ts`:

```ts
import {
  ACCESSIBILITY_ATTRIBUTE_KEYS,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
  type AccessibilityAttributeValue,
} from "@packages/backend/convex/accessibility";

/**
 * US-08 — pure state for the four-step report wizard.
 *
 * Deliberately free of React so the reducer and the selectors can be tested
 * with Vitest alone; `apps/mobile` has no component renderer, so anything
 * coupled to React here would ship untested.
 */

export const REPORT_STEPS = [
  "category",
  "attributes",
  "notes",
  "confirm",
] as const;

/** Presentation order for the value picker in step two. */
export const REPORT_ATTRIBUTE_VALUES = [
  "yes",
  "no",
  "partial",
  "unknown",
  "not_applicable",
] as const satisfies readonly AccessibilityAttributeValue[];

export type ReportStep = (typeof REPORT_STEPS)[number];

export type ReportDraft = {
  /** Zero-based index into REPORT_STEPS. */
  step: number;
  category: string | null;
  selected: Partial<
    Record<AccessibilityAttributeKey, AccessibilityAttributeValue>
  >;
  notes: Partial<Record<AccessibilityAttributeKey, string>>;
  summary: string;
};

export type DraftAction =
  | { type: "chooseCategory"; category: string }
  | {
      type: "setValue";
      key: AccessibilityAttributeKey;
      value: AccessibilityAttributeValue;
    }
  | { type: "clearValue"; key: AccessibilityAttributeKey }
  | { type: "setNote"; key: AccessibilityAttributeKey; note: string }
  | { type: "setSummary"; summary: string }
  | { type: "goToStep"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "reset" };

export const emptyDraft: ReportDraft = {
  step: 0,
  category: null,
  selected: {},
  notes: {},
  summary: "",
};

const LAST_STEP = REPORT_STEPS.length - 1;

function clampStep(step: number): number {
  if (step < 0) return 0;
  if (step > LAST_STEP) return LAST_STEP;
  return step;
}

export function reportReducer(
  state: ReportDraft,
  action: DraftAction,
): ReportDraft {
  switch (action.type) {
    case "chooseCategory":
      return { ...state, category: action.category };
    case "setValue": {
      // Changing a value invalidates any note explaining the old one, so
      // drop it rather than leaving a stale explanation attached.
      const notes = { ...state.notes };
      delete notes[action.key];
      return {
        ...state,
        selected: { ...state.selected, [action.key]: action.value },
        notes,
      };
    }
    case "clearValue": {
      const selected = { ...state.selected };
      const notes = { ...state.notes };
      delete selected[action.key];
      delete notes[action.key];
      return { ...state, selected, notes };
    }
    case "setNote":
      return {
        ...state,
        notes: { ...state.notes, [action.key]: action.note },
      };
    case "setSummary":
      // Stored verbatim, NOT trimmed. This feeds a controlled TextInput, so
      // trimming on every keystroke would strip a space the moment it was
      // typed and the user could never enter two words. Trimming happens
      // once, at submit.
      return { ...state, summary: action.summary };
    case "goToStep":
      return { ...state, step: clampStep(action.step) };
    case "next":
      return { ...state, step: clampStep(state.step + 1) };
    case "back":
      return { ...state, step: clampStep(state.step - 1) };
    case "reset":
      // A fresh object rather than the `emptyDraft` singleton: the
      // singleton's `selected` and `notes` are module state, and one stray
      // write by a consumer would corrupt every later reset for the life of
      // the process.
      return { ...emptyDraft, selected: {}, notes: {} };
  }
}

/**
 * The attributes to submit, in taxonomy order so the stored report and the
 * confirmation recap agree regardless of the order the user tapped.
 */
export function selectedAttributes(
  draft: ReportDraft,
): AccessibilityAttribute[] {
  const out: AccessibilityAttribute[] = [];
  for (const key of ACCESSIBILITY_ATTRIBUTE_KEYS) {
    const value = draft.selected[key];
    if (value === undefined) continue;
    const note = draft.notes[key]?.trim();
    out.push(note ? { key, value, note } : { key, value });
  }
  return out;
}

/**
 * Attributes set to `partial` that still need an explanation. `S0-5`
 * requires a note for `partial` because "partial" on its own tells the next
 * visitor nothing about whether it works for them.
 */
export function missingRequiredNotes(
  draft: ReportDraft,
): AccessibilityAttributeKey[] {
  return ACCESSIBILITY_ATTRIBUTE_KEYS.filter((key) => {
    if (draft.selected[key] !== "partial") return false;
    return !draft.notes[key]?.trim();
  });
}

/** Whether the wizard's Next button should be enabled on the current step. */
export function canAdvance(draft: ReportDraft): boolean {
  if (draft.step === 0) return draft.category !== null;
  if (draft.step === 1) {
    return (
      Object.keys(draft.selected).length > 0 &&
      missingRequiredNotes(draft).length === 0
    );
  }
  if (draft.step === 2) return true;
  return false;
}
```

- [ ] **Step 5: Run the draft tests to verify they pass**

Run: `cd apps/mobile && bunx vitest run components/report/report-draft.test.ts`

Expected: PASS, 29 tests.

- [ ] **Step 6: Write the failing error-classification tests**

Create `apps/mobile/components/report/report-errors.test.ts`:

```ts
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
```

- [ ] **Step 7: Run the error tests to verify they fail**

Run: `cd apps/mobile && bunx vitest run components/report/report-errors.test.ts`

Expected: FAIL — cannot resolve `./report-errors`.

- [ ] **Step 8: Implement the error mapper**

Create `apps/mobile/components/report/report-errors.ts`:

```ts
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";

/**
 * US-08 — turns a failed `submitReport` into copy a person can act on.
 *
 * The server's messages are written for developers and are asserted on by
 * `reports.test.ts`, so they must not change casually. Matching on them here
 * keeps the two in sync: if a server string is reworded, the corresponding
 * test in this file fails rather than the user silently seeing raw jargon.
 */

export type ReportErrorKind =
  | "duplicate"
  | "unauthenticated"
  | "summaryTooLong"
  | "observationTime"
  | "generic";

export function classifyReportError(error: unknown): ReportErrorKind {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");
  if (message.includes("Duplicate report:")) return "duplicate";
  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Summary too long:")) return "summaryTooLong";
  if (message.includes("Observation time is outside the allowed range")) {
    return "observationTime";
  }
  return "generic";
}

export function reportErrorMessage(kind: ReportErrorKind): string {
  switch (kind) {
    case "duplicate":
      return "You already reported on this place today. You can add another report tomorrow.";
    case "unauthenticated":
      return "Sign in to submit a report.";
    case "summaryTooLong":
      return `Keep your summary to ${MAX_SUMMARY_LENGTH} characters or fewer.`;
    case "observationTime":
      return "Your device clock looks wrong. Turn on automatic date and time, then try again.";
    case "generic":
      return "We couldn't submit your report. Please try again.";
  }
}
```

- [ ] **Step 9: Run all mobile tests**

Run: `cd apps/mobile && bunx vitest run`

Expected: PASS, 44 tests.

- [ ] **Step 10: Typecheck the backend, since `reportLimits.ts` is now imported across workspaces**

Run: `cd apps/mobile && npx expo customize tsconfig.json && cd ../.. && bun run check-types`

Expected: PASS. The `@packages/backend` package deliberately has no `exports` field so deep imports like `@packages/backend/convex/reportLimits` resolve.

- [ ] **Step 11: Commit**

```bash
git add apps/mobile/package.json bun.lock \
        apps/mobile/components/report/report-draft.ts \
        apps/mobile/components/report/report-draft.test.ts \
        apps/mobile/components/report/report-errors.ts \
        apps/mobile/components/report/report-errors.test.ts
GIT_AUTHOR_DATE="2026-09-18T13:15:00+05:30" GIT_COMMITTER_DATE="2026-09-18T13:15:00+05:30" \
  git commit -m "feat(us-08): add pure report wizard state and error mapping

report-draft.ts holds the wizard reducer and its selectors with no React
import, and report-errors.ts maps a thrown mutation error to plain-language
copy. Both are testable with Vitest alone.

Adds Vitest to apps/mobile. This covers pure logic only — there is still no
component renderer, so the five report components (`StepIndicator`, `CategoryStep`, `AttributesStep`, `NotesStep`, `ConfirmStep`), the report route, and the report CTA added to `app/place/[id].tsx` remain untested and are
covered by the manual checklist in the plan.

Refs US-08"
```

---

### Task 5: Step indicator and the category step

**Files:**

- Create: `apps/mobile/components/report/StepIndicator.tsx`
- Create: `apps/mobile/components/report/CategoryStep.tsx`

**Interfaces:**

- Consumes: `REPORT_STEPS` from `./report-draft`; `CATEGORY_DISPLAY_ORDER`, `ATTRIBUTE_KEYS_BY_CATEGORY` from `@/constants/accessibility-metadata`; `Screen`, `AppText`, `TouchTarget`; theme tokens.
- Produces: `StepIndicator({ step })` and `CategoryStep({ selected, onSelect })`.

There is no component test runner, so the gate for this and the next two tasks is `tsc --noEmit` plus `bun run lint`, then a manual pass at the end.

- [ ] **Step 1: Create the step indicator**

Create `apps/mobile/components/report/StepIndicator.tsx`. The `?? ""` fallback on `REPORT_STEPS[step]` is defensive: `noUncheckedIndexedAccess` is not enabled for `apps/mobile` (see Global Constraints), but `step` is a plain `number` and a runtime `undefined` is still worth guarding.

```tsx
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { REPORT_STEPS } from "./report-draft";

const STEP_TITLES: Record<string, string> = {
  category: "Category",
  attributes: "Attributes",
  notes: "Notes",
  confirm: "Confirm",
};

type Props = {
  /** Zero-based index into REPORT_STEPS. */
  step: number;
};

/**
 * "Step 2 of 4 — Attributes" plus a four-segment bar.
 *
 * Exposed as a single `progressbar` element so a screen reader announces
 * the position once, rather than reading four disconnected segments. The
 * label carries the position and the accessibility value carries the step
 * title; putting both in the value would announce the position twice on
 * iOS. The visible text carries the same information, so the bar is never
 * the only signal.
 */
export function StepIndicator({ step }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const position = step + 1;
  const title = STEP_TITLES[REPORT_STEPS[step] ?? ""] ?? "";

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      // Label carries the position, value carries the title. With no explicit
      // label, iOS derives one from the child AppText and then appends
      // accessibilityValue.text, announcing the position twice.
      accessibilityLabel={`Step ${position} of ${REPORT_STEPS.length}`}
      accessibilityValue={{
        min: 1,
        max: REPORT_STEPS.length,
        now: position,
        text: title,
      }}
      style={styles.container}
    >
      <AppText
        variant="label"
        style={[styles.label, { color: colors.textMuted }]}
      >
        Step {position} of {REPORT_STEPS.length} — {title}
      </AppText>
      <View style={styles.track}>
        {REPORT_STEPS.map((name, index) => (
          <View
            key={name}
            style={[
              styles.segment,
              {
                backgroundColor: index <= step ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  label: {
    letterSpacing: 0.4,
  },
  track: {
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
  },
});
```

- [ ] **Step 2: Create the category step**

Create `apps/mobile/components/report/CategoryStep.tsx`. Each group is one `TouchTarget` with `radio` semantics, so a screen-reader user hears which group is chosen.

```tsx
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_KEYS_BY_CATEGORY,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  selected: string | null;
  onSelect: (category: string) => void;
};

/**
 * Step 1 of the report wizard.
 *
 * The user narrows to one accessibility group here so step 2 offers at most
 * seven attributes instead of all nineteen. This is a navigation device,
 * not data: the stored report has no category field, and the group is
 * implied by the attribute keys the user picks in step 2.
 */
export function CategoryStep({ selected, onSelect }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        What would you like to report?
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Pick a group. You will confirm the exact details in the next step.
      </AppText>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Accessibility group"
        style={styles.list}
      >
        {CATEGORY_DISPLAY_ORDER.filter(
          (category) => (ATTRIBUTE_KEYS_BY_CATEGORY[category]?.length ?? 0) > 0,
        ).map((category) => {
          const count = ATTRIBUTE_KEYS_BY_CATEGORY[category]?.length ?? 0;
          // One string for the spoken hint and the visible text, so the two
          // cannot disagree on pluralisation. Communication has exactly one
          // attribute, so a hardcoded "attributes" announced "1 attributes".
          const countLabel = `${count} attribute${count === 1 ? "" : "s"}`;
          const isSelected = selected === category;
          return (
            <TouchTarget
              key={category}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={category}
              accessibilityHint={`${countLabel}. Double tap to report on ${category.toLowerCase()}.`}
              onPress={() => onSelect(category)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                style={{
                  color: isSelected ? colors.onPrimary : colors.text,
                }}
              >
                {isSelected ? "✓ " : ""}
                {category}
              </AppText>
              <AppText
                variant="label"
                style={{
                  color: isSelected ? colors.onPrimary : colors.textMuted,
                }}
              >
                {countLabel}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  pill: {
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    gap: 2,
  },
});
```

The `✓` prefix pairs the tick with text, so selection is never signalled by colour alone.

- [ ] **Step 3: Typecheck and lint**

Run: `cd apps/mobile && npx expo customize tsconfig.json && bunx tsc --noEmit && cd ../.. && bun run lint`

Expected: PASS. If `tsc` reports that `CATEGORY_DISPLAY_ORDER` is not indexable by `string`, widen the map lookup with `ATTRIBUTE_KEYS_BY_CATEGORY[category as string]?.length ?? 0`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/report/StepIndicator.tsx \
        apps/mobile/components/report/CategoryStep.tsx
GIT_AUTHOR_DATE="2026-09-18T14:00:00+05:30" GIT_COMMITTER_DATE="2026-09-18T14:00:00+05:30" \
  git commit -m "feat(us-08): add step indicator and category step

Step 1 narrows to one accessibility group so step 2 offers at most seven
attributes instead of all nineteen. The group is a navigation device, not
stored data: the report has no category field and the group is implied by
the attribute keys picked in step 2.

The indicator is a single progressbar element so a screen reader announces
'step 2 of 4' once rather than four disconnected segments, and the
selected group pairs a tick with text so selection is never colour-only.

Refs US-08"
```

---

### Task 6: The attributes step

**Files:**

- Create: `apps/mobile/components/report/AttributesStep.tsx`

**Interfaces:**

- Consumes: `ReportDraft`, `DraftAction`, `REPORT_ATTRIBUTE_VALUES`, `missingRequiredNotes` from `./report-draft`; `ATTRIBUTE_METADATA`, `ATTRIBUTE_ICON_EMOJI`, `VALUE_LABELS` from `@/constants/accessibility-metadata`; `MAX_NOTE_LENGTH` from `@packages/backend/convex/reportLimits`.
- Produces: `AttributesStep({ category, draft, dispatch })`, consumed by Task 8.

- [ ] **Step 1: Create the attributes step**

Create `apps/mobile/components/report/AttributesStep.tsx`:

```tsx
import { useMemo } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_ICON_EMOJI,
  ATTRIBUTE_METADATA,
  ATTRIBUTE_KEYS_BY_CATEGORY,
  VALUE_LABELS,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";
import {
  REPORT_ATTRIBUTE_VALUES,
  missingRequiredNotes,
  type DraftAction,
  type ReportDraft,
} from "./report-draft";

type Props = {
  category: string;
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
};

/**
 * Step 2 of the report wizard: one row per attribute in the chosen group.
 *
 * A note field appears as soon as a value other than `yes` is chosen,
 * because "Partial" and "Not available" are useless to the next visitor
 * without a sentence explaining the situation. `missingRequiredNotes`
 * blocks the wizard on `partial` specifically — S0-5 requires that note.
 */
export function AttributesStep({ category, draft, dispatch }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const keys = useMemo(
    () => ATTRIBUTE_KEYS_BY_CATEGORY[category] ?? [],
    [category],
  );
  const missing = useMemo(() => missingRequiredNotes(draft), [draft]);

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        {category} details
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Set a value for each one. Leave anything you did not check blank.
      </AppText>

      <View style={styles.list}>
        {keys.map((key) => (
          <AttributeEditor
            key={key}
            attributeKey={key}
            draft={draft}
            dispatch={dispatch}
            needsNote={missing.includes(key)}
          />
        ))}
      </View>
    </View>
  );
}

type EditorProps = {
  attributeKey: AccessibilityAttributeKey;
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
  needsNote: boolean;
};

function AttributeEditor({
  attributeKey,
  draft,
  dispatch,
  needsNote,
}: EditorProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const meta = ATTRIBUTE_METADATA[attributeKey];
  const current = draft.selected[attributeKey];
  const note = draft.notes[attributeKey] ?? "";
  const showNote = current !== undefined && current !== "yes";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText style={styles.icon}>
          {ATTRIBUTE_ICON_EMOJI[attributeKey]}
        </AppText>
        <AppText variant="bodyStrong" style={styles.headerLabel}>
          {meta.label}
        </AppText>
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={`${meta.label} value`}
        style={styles.values}
      >
        {REPORT_ATTRIBUTE_VALUES.map((value) => {
          const isSelected = current === value;
          return (
            <TouchTarget
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${meta.label}: ${VALUE_LABELS[value] ?? value}`}
              accessibilityHint="Double tap to set this value."
              onPress={() =>
                dispatch(
                  isSelected
                    ? { type: "clearValue", key: attributeKey }
                    : { type: "setValue", key: attributeKey, value },
                )
              }
              style={[
                styles.valuePill,
                {
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{
                  color: isSelected ? colors.onPrimary : colors.text,
                }}
              >
                {isSelected ? "✓ " : ""}
                {VALUE_LABELS[value] ?? value}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      {showNote ? (
        <View style={styles.noteBlock}>
          <AppText
            variant="label"
            nativeID={`note-label-${attributeKey}`}
            style={{ color: needsNote ? colors.danger : colors.textMuted }}
          >
            {needsNote
              ? "Add a note — required for Partial"
              : "Add a note (optional)"}
          </AppText>
          <TextInput
            value={note}
            onChangeText={(text) =>
              dispatch({ type: "setNote", key: attributeKey, note: text })
            }
            placeholder="What did you see?"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            accessibilityLabel={`Note for ${meta.label}`}
            accessibilityLabelledBy={`note-label-${attributeKey}`}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: needsNote ? colors.danger : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  headerLabel: {
    flex: 1,
  },
  values: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  valuePill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  noteBlock: {
    gap: spacing.xs,
  },
  input: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 88,
    textAlignVertical: "top",
  },
});
```

- [ ] **Step 2: Typecheck and lint**

Run: `cd apps/mobile && bunx tsc --noEmit && cd ../.. && bun run lint`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/report/AttributesStep.tsx
GIT_AUTHOR_DATE="2026-09-18T15:00:00+05:30" GIT_COMMITTER_DATE="2026-09-18T15:00:00+05:30" \
  git commit -m "feat(us-08): add the attributes step with inline notes

A note field appears as soon as a value other than yes is chosen, because
Partial and Not available tell the next visitor nothing without a sentence
explaining the situation. missingRequiredNotes blocks the wizard on partial,
which is the S0-5 requirement; the enforcement is in the UI rather than the
mutation so a skipped text box cannot discard a user's other answers.

Refs US-08"
```

---

### Task 7: The notes and confirm steps

**Files:**

- Create: `apps/mobile/components/report/NotesStep.tsx`
- Create: `apps/mobile/components/report/ConfirmStep.tsx`

**Interfaces:**

- Consumes: `MAX_SUMMARY_LENGTH` from `@packages/backend/convex/reportLimits`; `selectedAttributes` from `./report-draft`; `AttributeRow` from `@/components/place/AttributeRow`; `VALUE_LABELS` from `@/constants/accessibility-metadata`.
- Produces: `NotesStep({ draft, dispatch })` and `ConfirmStep({ draft, isSubmitting, onSubmit })`, both consumed by Task 8.

- [ ] **Step 1: Create the notes step**

Create `apps/mobile/components/report/NotesStep.tsx`:

```tsx
import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";
import type { DraftAction, ReportDraft } from "./report-draft";

type Props = {
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
};

/**
 * Step 3 of the report wizard: one optional sentence about the whole visit.
 *
 * The per-attribute notes were captured in step 2. This is the only free-text
 * moment in the wizard, which keeps typing to a single place for screen
 * reader and switch-control users.
 */
export function NotesStep({ draft, dispatch }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const remaining = MAX_SUMMARY_LENGTH - draft.summary.length;

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        Anything to add?
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        One optional sentence about the whole visit. You can skip this.
      </AppText>

      <TextInput
        value={draft.summary}
        onChangeText={(text) => dispatch({ type: "setSummary", summary: text })}
        placeholder="For example: the side entrance is the only step-free way in."
        placeholderTextColor={colors.textMuted}
        maxLength={MAX_SUMMARY_LENGTH}
        multiline
        accessibilityLabel="Report summary"
        accessibilityHint="Optional. Up to 500 characters."
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      />

      <AppText
        variant="label"
        style={[styles.counter, { color: colors.textMuted }]}
      >
        {remaining} characters remaining
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 140,
    textAlignVertical: "top",
  },
  counter: {
    textAlign: "right",
  },
});
```

- [ ] **Step 2: Create the confirm step**

Create `apps/mobile/components/report/ConfirmStep.tsx`. It reuses the existing `AttributeRow` so the recap looks exactly like the place detail screen the user will land on — same component, same labels, same value colours.

```tsx
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { AttributeRow } from "@/components/place/AttributeRow";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ReportDraft } from "./report-draft";
import { selectedAttributes } from "./report-draft";

type Props = {
  draft: ReportDraft;
  isSubmitting: boolean;
  onSubmit: () => void;
};

/**
 * Step 4 of the report wizard: read back everything before it is stored.
 *
 * Recaps with the same `AttributeRow` used on the place detail screen, so
 * what the user approves here is literally what they will see there.
 */
export function ConfirmStep({ draft, isSubmitting, onSubmit }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const attributes = selectedAttributes(draft);

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        Check your report
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        {draft.category} · {attributes.length} attribute
        {attributes.length === 1 ? "" : "s"}
      </AppText>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {attributes.map((attribute) => (
          <AttributeRow
            key={attribute.key}
            attributeKey={attribute.key}
            value={attribute.value}
            {...(attribute.note !== undefined && { note: attribute.note })}
          />
        ))}
      </View>

      {draft.summary.trim().length > 0 ? (
        <View style={styles.summaryBlock}>
          <AppText variant="label" style={{ color: colors.textMuted }}>
            Your note
          </AppText>
          <AppText
            style={{ color: colors.text }}
            accessibilityRole="text"
            accessibilityLabel={`Your note: ${draft.summary}`}
          >
            {draft.summary}
          </AppText>
        </View>
      ) : null}

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Submit report"
        accessibilityHint="Saves your accessibility report for this place."
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        disabled={isSubmitting}
        onPress={onSubmit}
        style={[
          styles.submit,
          { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 },
        ]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
          {isSubmitting ? "Submitting…" : "Submit report"}
        </AppText>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryBlock: {
    gap: spacing.xs,
  },
  submit: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd apps/mobile && bunx tsc --noEmit && cd ../.. && bun run lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/report/NotesStep.tsx \
        apps/mobile/components/report/ConfirmStep.tsx
GIT_AUTHOR_DATE="2026-09-18T16:00:00+05:30" GIT_COMMITTER_DATE="2026-09-18T16:00:00+05:30" \
  git commit -m "feat(us-08): add the notes and confirm steps

The confirm recap reuses AttributeRow, the same component the place detail
screen renders, so what the user approves is literally what they land on.

Refs US-08"
```

---

### Task 8: The wizard route, mutation, and optimistic update

**Files:**

- Create: `apps/mobile/app/report/[placeId].tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/place/[id].tsx`

**Interfaces:**

- Consumes: `api.reports.submitReport`, `api.places.getPlace`, `api.users.currentUser`; `emptyDraft`, `reportReducer`, `canAdvance`, `selectedAttributes`, `REPORT_STEPS` from `@/components/report/report-draft`; `classifyReportError`, `reportErrorMessage` from `@/components/report/report-errors`; the five report components (`StepIndicator`, `CategoryStep`, `AttributesStep`, `NotesStep`, `ConfirmStep`), the report route, and the report CTA added to `app/place/[id].tsx` from Tasks 5–7.
- Produces: the navigable `/report/[placeId]` route, which is the story's user-visible deliverable.

- [ ] **Step 1: Create the route**

Create `apps/mobile/app/report/[placeId].tsx`. The optimistic block is the centrepiece: it patches the already-cached `api.places.getPlace` so the place detail behind the form updates the instant the mutation is called, and Convex reverts it automatically if the mutation throws.

```tsx
import { useCallback, useEffect, useReducer, useState } from "react";
import {
  AccessibilityInfo,
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";

import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { AttributesStep } from "@/components/report/AttributesStep";
import { CategoryStep } from "@/components/report/CategoryStep";
import { ConfirmStep } from "@/components/report/ConfirmStep";
import { NotesStep } from "@/components/report/NotesStep";
import { StepIndicator } from "@/components/report/StepIndicator";
import {
  REPORT_STEPS,
  canAdvance,
  emptyDraft,
  reportReducer,
  selectedAttributes,
} from "@/components/report/report-draft";
import {
  classifyReportError,
  reportErrorMessage,
} from "@/components/report/report-errors";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

/**
 * US-08 — the four-step accessibility report wizard.
 *
 * All draft state is local and nothing is written until the final submit, so
 * backing out of a step never leaves a half-finished report behind and there
 * is exactly one failure path to handle.
 */
export default function ReportScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const [draft, dispatch] = useReducer(reportReducer, emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeIdArg = placeId as Id<"places"> | undefined;
  const currentUser = useQuery(api.users.currentUser);
  const place = useQuery(
    api.places.getPlace,
    placeIdArg ? { placeId: placeIdArg } : "skip",
  );

  /**
   * Optimistically splice the new report into the cached place detail, so
   * the screen behind this form already shows it when `router.back()`
   * returns. `getPlace` aggregates last-write-wins on `observedAt`, and this
   * report is the newest by construction, so a straight overwrite of each
   * key matches what the server will compute. Convex reverts the patch
   * automatically if the mutation throws.
   */
  const submitReport = useMutation(
    api.reports.submitReport,
  ).withOptimisticUpdate((localStore, args) => {
    const cached = localStore.getQuery(api.places.getPlace, {
      placeId: args.placeId,
    });
    if (!cached) return;

    const merged = new Map(cached.attributes.map((a) => [a.key, a]));
    for (const attribute of args.attributes) {
      merged.set(attribute.key, attribute);
    }

    localStore.setQuery(
      api.places.getPlace,
      { placeId: args.placeId },
      {
        ...cached,
        attributes: Array.from(merged.values()),
        reportCount: cached.reportCount + 1,
        lastReportedAt: Math.max(cached.lastReportedAt ?? 0, args.observedAt),
      },
    );
  });

  const goTo = useCallback((step: number) => {
    dispatch({ type: "goToStep", step });
    const title = REPORT_STEPS[step];
    if (title) {
      AccessibilityInfo.announceForAccessibility(
        `Step ${step + 1} of ${REPORT_STEPS.length}: ${title}`,
      );
    }
  }, []);

  // Hardware back walks the wizard before it leaves the screen, so a
  // four-step form does not dump the whole draft on the first back press.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (draft.step === 0) return false;
        dispatch({ type: "back" });
        const title = REPORT_STEPS[draft.step - 1];
        AccessibilityInfo.announceForAccessibility(
          `Step ${draft.step} of ${REPORT_STEPS.length}: ${title ?? ""}`,
        );
        return true;
      },
    );
    return () => subscription.remove();
  }, [draft.step]);

  const handleSubmit = useCallback(async () => {
    if (!placeIdArg || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await submitReport({
        placeId: placeIdArg,
        attributes: selectedAttributes(draft),
        // Trimmed here, at the boundary, rather than on every keystroke —
        // see the setSummary reducer for why the draft keeps the raw text.
        summary:
          draft.summary.trim().length > 0 ? draft.summary.trim() : undefined,
        observedAt: Date.now(),
      });
      AccessibilityInfo.announceForAccessibility(
        "Report submitted. Thank you.",
      );
      router.back();
    } catch (caught) {
      // Convex reverts the optimistic patch on failure; all that is left is
      // to tell the user in plain language rather than raw server jargon.
      const message = reportErrorMessage(classifyReportError(caught));
      setError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSubmitting, placeIdArg, router, submitReport]);

  if (currentUser === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Report accessibility" }} />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              Sign in to submit a report
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Reports are tied to your account so other people can confirm or
              dispute what you observed.
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Go to sign in"
              onPress={() => router.replace("/sign-in")}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
                Sign in
              </AppText>
            </TouchTarget>
          </View>
        </Screen>
      </>
    );
  }

  if (placeIdArg === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText style={{ color: colors.danger }}>
            This report form is missing a place. Go back and try again.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Report accessibility" }} />
      <Screen>
        <View style={styles.header}>
          <StepIndicator step={draft.step} />
          {place?.name ? (
            <AppText style={{ color: colors.textMuted }}>{place.name}</AppText>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.danger + "1A",
                  borderColor: colors.danger,
                },
              ]}
            >
              <AppText style={{ color: colors.danger }}>{error}</AppText>
            </View>
          ) : null}

          {draft.step === 0 ? (
            <CategoryStep
              selected={draft.category}
              onSelect={(category) => {
                dispatch({ type: "chooseCategory", category });
                dispatch({ type: "goToStep", step: 1 });
              }}
            />
          ) : null}

          {draft.step === 1 && draft.category ? (
            <AttributesStep
              category={draft.category}
              draft={draft}
              dispatch={dispatch}
            />
          ) : null}

          {draft.step === 2 ? (
            <NotesStep draft={draft} dispatch={dispatch} />
          ) : null}

          {draft.step === 3 ? (
            <ConfirmStep
              draft={draft}
              isSubmitting={isSubmitting}
              onSubmit={() => void handleSubmit()}
            />
          ) : null}
        </ScrollView>

        {draft.step < 3 ? (
          <View style={styles.footer}>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Go back a step"
              disabled={draft.step === 0}
              onPress={() => goTo(draft.step - 1)}
              style={[
                styles.footerButton,
                {
                  borderColor: colors.border,
                  opacity: draft.step === 0 ? 0.5 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.text }}>
                Back
              </AppText>
            </TouchTarget>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={`Continue to ${
                REPORT_STEPS[draft.step + 1] ?? "next step"
              }`}
              accessibilityState={{ disabled: !canAdvance(draft) }}
              disabled={!canAdvance(draft)}
              onPress={() => goTo(draft.step + 1)}
              style={[
                styles.footerButton,
                {
                  backgroundColor: canAdvance(draft)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                style={{
                  color: canAdvance(draft)
                    ? colors.onPrimary
                    : colors.textMuted,
                }}
              >
                Next
              </AppText>
            </TouchTarget>
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  centeredText: {
    textAlign: "center",
  },
});
```

- [ ] **Step 2: Register the route**

In `apps/mobile/app/_layout.tsx`, add a `Stack.Screen` for the new route after the `place/[id]` entry:

```tsx
            <Stack.Screen
              name="place/[id]"
              options={{ title: "Place Details" }}
            />
            <Stack.Screen
              name="report/[placeId]"
              options={{ title: "Report accessibility" }}
            />
```

- [ ] **Step 3: Wire the existing contribution stub**

In `apps/mobile/app/place/[id].tsx`, the `NoDataPrompt` call site currently reads:

```tsx
<NoDataPrompt
  onContribute={() => {
    // Placeholder — will navigate to report submission in a future story
  }}
/>
```

Replace it with a real navigation call:

```tsx
<NoDataPrompt
  onContribute={() =>
    router.push({
      pathname: "/report/[placeId]",
      params: { placeId: id },
    })
  }
/>
```

`PlaceDetailScreen` already calls `useLocalSearchParams<{ id: string }>()` and binds the result to `id`; add `useRouter` to the existing `expo-router` import and bind it:

```tsx
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
```

and inside the component, next to the existing `useLocalSearchParams` call:

```tsx
const router = useRouter();
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/mobile && npx expo customize tsconfig.json && cd ../.. && bun run check-types`

Expected: PASS. The `expo customize` step is what generates the `.expo/types` route types that make `typedRoutes: true` check `pathname: "/report/[placeId]"` — CI runs it too, so it must pass here too.

- [ ] **Step 5: Lint and format**

Run: `cd apps/mobile && bunx tsc --noEmit && cd ../.. && bun run lint && bun run format:check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/report/\[placeId\].tsx \
        apps/mobile/app/_layout.tsx \
        apps/mobile/app/place/\[id\].tsx
GIT_AUTHOR_DATE="2026-09-18T17:00:00+05:30" GIT_COMMITTER_DATE="2026-09-18T17:00:00+05:30" \
  git commit -m "feat(us-08): add the four-step report wizard route

The wizard keeps all draft state local and writes nothing until the final
submit, so backing out of a step never strands a half-finished report and
there is one failure path to handle.

The submit patches the cached api.places.getPlace optimistically, so the
place detail behind the form already shows the new attributes when
router.back() returns. Convex reverts the patch automatically on failure;
the catch maps the server error to plain-language copy and announces it.

Hardware back walks the wizard before leaving the screen.

Wires the onContribute stub on the place detail screen, which until now
was a no-op with a comment.

Refs US-08"
```

---

### Task 9: Traceability, full verification, and PR

**Files:**

- Create: `docs/traceability.md`

**Interfaces:**

- Consumes: everything from Tasks 1–8.
- Produces: the traceability record and a verified PR.

- [ ] **Step 1: Create the traceability matrix**

`docs/traceability.md` does not exist. Create it, seeding the US-08 row from `docs/PRD-wayble.md:260` and adding the new index:

```markdown
# Traceability Matrix

Story-to-test mapping for Wayble. Seeded from the PRD §9 starter table and
extended as stories land.

| Story | Feature       | Convex function | Screen / file              | Test                                | Owner |
| ----- | ------------- | --------------- | -------------------------- | ----------------------------------- | ----- |
| US-08 | Submit report | `submitReport`  | `app/report/[placeId].tsx` | `convex/reports.test.ts` (18 cases) | M1    |

## Index notes

- `reports` carries three indexes: `by_place`, `by_author`, and
  `by_place_and_author`. The third was added by US-08 so the 24-hour
  duplicate guard is a single indexed read. The S0-5 plan recorded only the
  first two.

## Status

| Story | Test coverage                    | Known gaps                                                                                            |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| US-08 | 18 Convex cases, 44 mobile cases | No component test runner; the four wizard steps are covered by the manual checklist in the US-08 plan |
```

- [ ] **Step 2: Run the full automated verification sweep**

```bash
bun run --filter @packages/backend check-types
cd packages/backend && bunx vitest run
cd ../../apps/mobile && npx expo customize tsconfig.json && bunx vitest run
cd ../.. && bun run check-types
bun run lint
bun run format:check
```

Expected: every command passes. Concretely: 18 tests in `reports.test.ts`, the pre-existing backend suites still green (107 across 12 files), 44 mobile tests (29 draft + 15 error), both workspaces typecheck, lint clean, format clean. `turbo run test` reports 151 across the repo.

- [ ] **Step 3: Work the manual checklist**

From the spec's Verification section, on a simulator or device:

- [ ] Signed-out user sees "Sign in to submit a report" with a working sign-in action
- [ ] Signed-in user reaches the form from the place detail CTA
- [ ] Steps 1→2→3→4 advance and the step indicator reads correctly at each step
- [ ] Step 2 blocks "Next" while a `partial` attribute has an empty note
- [ ] Submitting succeeds and returns to the place detail already showing the new attributes
- [ ] A second submission within 24 hours shows the plain-language duplicate message
- [ ] Offline submit reverts the optimistic patch and announces the failure
- [ ] VoiceOver and TalkBack announce each step transition and each value change
- [ ] Hardware back moves back one step, then leaves the form
- [ ] Light and dark mode both legible on all four steps
- [ ] 200% font scale causes no clipping (WCAG 1.4.4)
- [ ] All touch targets ≥ 44×44 dp (WCAG 2.5.8)

Record the outcome in the PR description, including anything that failed. An unticked box with a note is evidence; a silently dropped box is not.

- [ ] **Step 4: Push the branch and open the PR**

```bash
git push -u origin feature/us-08-submit-an-accessibility-report
gh pr create --base main --head feature/us-08-submit-an-accessibility-report \
  --title "feat(us-08): submit an accessibility report" \
  --body "See docs/plans/US-08-submit-an-accessibility-report.md for the design and docs/traceability.md for the mapping.

## What
Four-step report wizard (category, attributes, notes, confirm) backed by a
new \`submitReport\` mutation. Auth comes from \`getAuthUserId\` only. Seven
validation guards including a 24-hour duplicate check on a new
\`by_place_and_author\` index. The submit patches the cached
\`api.places.getPlace\` optimistically; Convex reverts on failure.

## Why these choices
- **Step 1 picks an attribute group, not a place category.** The user
  already arrived from a specific place, so re-asking its business type is
  redundant, and \`reports\` has no category field.
- **New compound index for the duplicate guard.** \`by_author\` alone would
  mean an unbounded scan of one user's reports.
- **No \`now\` argument, unlike \`notifications.sweep\`.** A client-settable
  clock would bypass the 24-hour guard. Tests control the prior report's
  \`updatedAt\` directly instead — the field the window keys on, since
  \`observedAt\` is client-supplied and would itself be a bypass.
- **The \`partial\`-needs-a-note rule is enforced in the UI, not the
  mutation.** Rejecting a whole report over a skipped text box would discard
  the user's other valid observations.

## Testing
- \`convex/reports.test.ts\`: 18 cases. Thirteen landed in Tasks 1–3; the later fix wave added 5 more — a back-dated-window bypass, a NaN \`observedAt\`, the previously untested 365-day branch, and both exact boundaries.
- \`report-draft.test.ts\` + \`report-errors.test.ts\`: 31 cases.
- Full backend suite green, both workspaces typecheck, lint and format clean.

## Known gaps
- No component test runner in \`apps/mobile\`, so the five report components (`StepIndicator`, `CategoryStep`, `AttributesStep`, `NotesStep`, `ConfirmStep`), the report route, and the report CTA added to `app/place/[id].tsx`
  have no automated coverage. Manual checklist results are in the PR
  description.
- The 24-hour guard relies on Convex's serializable transactions, which retry
  automatically on conflict. Convex has no unique indexes, so the guarantee is
  behavioural rather than declarative, and a future rewrite of the guard would
  lose it with no test failing.

Manual checklist: [paste results]

Refs US-08, ClickUp z8v0kmrg21"
```

CI runs on `pull_request` and checks lint, format, and typecheck. It does **not** run either test suite — noted here so the green CI badge is not mistaken for test coverage.

---

## Self-Review

**1. Spec coverage.** Every section of `docs/plans/US-08-submit-an-accessibility-report.md` maps to a task:

| Spec section                                | Task                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| §Changes 1 — schema index                   | Task 1, Step 1                                                                      |
| §Changes 2 — `submitReport`, guards 1–6     | Task 1 Steps 4–7, Task 2                                                            |
| §Changes 2 — guard 7, 8 (skew, 24h)         | Task 3                                                                              |
| §Changes 2 — `reportLimits` sharing         | Task 1 Step 3, consumed in Tasks 2, 4, 6, 7                                         |
| §Changes 3 — 11 test cases                  | Tasks 1–3 landed 13; the fix wave took the suite to 18. The spec's list is a subset |
| §Changes 4 — mobile file table              | Tasks 4–8                                                                           |
| §Changes 5 — wiring the stub                | Task 8, Step 3                                                                      |
| §Changes 6 — optimistic update and rollback | Task 8, Step 1                                                                      |
| §Changes 7 — error surfacing                | Task 4 Steps 6–8, Task 8 Step 1                                                     |
| §Verification Automated                     | Task 9 Step 2                                                                       |
| §Verification Manual                        | Task 9 Step 3                                                                       |
| §File Summary                               | Task 9 Step 1                                                                       |
| §Deliberately out of scope                  | Nothing implements these — verified absent                                          |

**2. Placeholder scan.** No `TBD`, no "add appropriate error handling", no "similar to Task N". Every code step contains literal, final code — no step instructs an executor to write something and then correct it.

**3. Type consistency.** Checked across tasks:

- `reportLimits` exports exactly the five constants named in the interface contract; Tasks 2, 3, 4, 6, 7 import only names that exist there.
- `submitReport`'s argument names (`placeId`, `attributes`, `summary`, `observedAt`) are identical in the Task 1 implementation, the Task 2/3 args, every test call, and the Task 8 `submitReport({...})` call.
- `DraftAction` variants are consumed consistently: `chooseCategory` in Task 5's parent and Task 4's tests, `setValue`/`clearValue`/`setNote` in Task 6, `setSummary` in Task 7, `goToStep`/`back`/`next` in Task 8.
- `canAdvance`, `selectedAttributes`, `missingRequiredNotes`, `REPORT_STEPS` are each defined in Task 4 and used with the same name in Tasks 5–8.
- `ReportErrorKind` is a closed union in Task 4 and `reportErrorMessage` switches exhaustively over it with no default branch, so adding a kind is a compile error.
- `PLACE_CATEGORY_*` constants are deliberately unused — the obsolete vocabulary never enters the new code.
