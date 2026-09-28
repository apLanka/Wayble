# Sprint 3 delivery — verified fact base

**Snapshot of `origin/main` at `e6379fc`, measured 2026-09-29.** Every number
below was produced by a command shown with its output, on that date, on that
commit. If a number here disagrees with the code, the code moved and this file is
stale — it is a snapshot, not a live view.

This is the citation target for `docs/traceability.md`,
`docs/adr/`, `docs/sprint-3-burndown.md` and `docs/sprint-3-retrospective.md`.
Nothing in those documents asserts a fact that is not recorded here first.

---

## 1. Delivery state, per Sprint 3 story

Sprint 3 ran **07–18 Sep 2026**. PRD §9 assigns each story a Convex function;
this is whether that function exists in `main`.

```bash
$ for f in submitReport listForPlace verifyReport forReport computeConfidence \
           flagReport matchScore recentVerifications generateUploadUrl; do
    grep -rlE "export const $f" packages/backend/convex --include='*.ts' | grep -v _generated
  done
```

| Story                 | Function PRD §9 names | In `main`? | Where                                                |
| --------------------- | --------------------- | ---------- | ---------------------------------------------------- |
| US-08 submit report   | `submitReport`        | **yes**    | `convex/reports.ts`                                  |
| US-08 (index reads)   | `listForPlace`        | **yes**    | `convex/reports.ts`                                  |
| US-10 confirm/dispute | `verifyReport`        | **yes**    | `convex/verifications.ts`                            |
| US-10 (tally)         | `forReport`           | **yes**    | `convex/verifications.ts`                            |
| US-09 photo evidence  | `generateUploadUrl`   | **no**     | absent everywhere                                    |
| US-11 confidence      | `computeConfidence`   | **no**     | unmerged `origin/feature/s3-4-…(US-11)`              |
| US-13 flagging        | `flagReport`          | **no**     | absent everywhere                                    |
| US-16 needs ranking   | `matchScore`          | **no**     | absent everywhere                                    |
| US-23 live feed       | `recentVerifications` | **no**     | absent from `main` **and** from `origin/feat/s3-7-…` |

```bash
$ grep -rlE "export const computeConfidence|export const flagReport|export const matchScore|export const recentVerifications|export const generateUploadUrl" \
    packages/backend/convex --include='*.ts' | grep -v _generated
(no output)
```

**Five of the seven Sprint 3 stories are not in `main`.**

### The branches, and what they hold

```bash
$ git branch -r | grep -iE "us-09|us-11|us-13|us-16|us-23|flag|confidence|ranking|feed|photo"
  origin/feat/s3-7-live-activity-feed-of-nearby-verifications-(us-23)
  origin/feature/s3-4-confidence-level-&-last-verified-date-(US-11)
```

| Branch                         | Author             | Tip date       | Holds the story's work?                                                                                                                                                  |
| ------------------------------ | ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `origin/feature/s3-4-…(US-11)` | Nishara Senadheera | 2026-09-28     | **yes** — `convex/confidence.ts` with `computeConfidence`, written **2026-09-07**, the day Sprint 3 opened, and unmerged for 22 days. Only a generated-types sync since. |
| `origin/feat/s3-7-…(us-23)`    | Aathika Ilmudeen   | **2026-08-29** | **no** — no `recentVerifications`, and the tip _predates the sprint by three weeks_                                                                                      |
| —                              | —                  | —              | no branch exists for US-09, US-13 or US-16                                                                                                                               |

---

## 2. When the work reached `main`

This is the most consequential finding in this file, and it is invisible in the
commit log.

```bash
$ git log --first-parent --format='%ad %h %s' --date=short origin/main -6
2026-09-28 e6379fc Merge pull request #25 from apLanka/chore/strip-claude-coauthor
2026-09-26 7c6eb55 Merge pull request #21 from apLanka/stoxmod-dev
2026-08-29 32f946e Merge pull request #20 from apLanka/feature/-testing_backend
2026-08-29 2ab7d01 Merge pull request #19 from apLanka/feature/seed-initial-places-data
2026-08-25 13ff456 chore: fix merge issues
2026-08-25 dc8b0c8 Merge pull request #17 from apLanka/feature/push-notification-verify-nearby
```

**`main` received no merge at all between 2026-08-29 and 2026-09-26** — a
four-week gap that contains the entire Sprint 3 window.

Which merge brought each story in, found by testing for the function's presence
in each merge's tree:

```bash
$ for m in $(git log --first-parent --format='%H' origin/main -4); do
    echo "$(git log -1 --format='%ad' --date=short $m)  $(git show $m:packages/backend/convex/reports.ts | grep -c 'export const submitReport')"
  done
2026-09-28  1
2026-09-26  0
2026-08-29  0
2026-08-29  0
```

`verifyReport` gives the identical result. So:

|       | Written                                      | Reached `main` |
| ----- | -------------------------------------------- | -------------- |
| US-08 | 2026-09-16 (44 commits, 44 tagged `(us-08)`) | **2026-09-28** |
| US-10 | 2026-09-27 (10 commits)                      | **2026-09-28** |

**Both stories shipped in one merge, `e6379fc`, on 2026-09-28 — ten days after
Sprint 3 closed — on a branch named `chore/strip-claude-coauthor`.**

Three separate facts hide in that one line, and each is worth stating separately
in the retrospective:

1. Sprint 3's entire output reached `main` in a single merge.
2. That merge landed ten days after the sprint's own end date.
3. It arrived on a branch named for a chore, not for a story.

### Two views of the window, and why both are needed

```bash
$ git log --format='%ad' --date=short --since=2026-09-07 --until=2026-09-19 | sort | uniq -c
      1 2026-09-07
     46 2026-09-16

$ git log --format='%s' --since=2026-09-07 --until=2026-09-19 | sed -nE 's/.*\((us-[a-z0-9-]+)\).*/\1/p' | sort | uniq -c
     44 us-08
```

_Work done_ in the window: 47 commits, 46 of them on one day, 44 of those tagged
US-08. _Work merged_ in the window: nothing at all.

**Neither view can produce a burndown curve.** The first is a single spike; the
second is empty. ClickUp card close dates are the only source that records when
each card actually closed, and the burndown document says so above its table
rather than reconstructing something plausible from either.

---

## 3. Test inventory

Three runners, not two. `turbo run test` covers the first two and misses the
third, because `scripts/` is not a turbo workspace.

```bash
$ bun run --filter @packages/backend test
  Test Files  17 passed (17)
       Tests  162 passed (162)

$ bun run --filter mobile test
  Test Files  7 passed (7)
       Tests  116 passed (116)

$ bun run test          # root: bun test scripts/
 18 pass
  Ran 18 tests across 1 file.
```

### Backend, per suite — 162 cases across 17 files

| Suite                                       | Cases |     | Suite                                     | Cases |
| ------------------------------------------- | ----- | --- | ----------------------------------------- | ----- |
| `convex/testing/reports.test.ts`            | 23    |     | `convex/testing/notificationCopy.test.ts` | 7     |
| `convex/testing/users.test.ts`              | 20    |     | `convex/testing/placesSeedData.test.ts`   | 6     |
| `convex/testing/places.test.ts`             | 17    |     | `convex/testing/accessibility.test.ts`    | 5     |
| `convex/testing/sweep.test.ts`              | 15    |     | `convex/testing/auth.test.ts`             | 4     |
| `convex/testing/notifications.test.ts`      | 12    |     | `convex/testing/health.test.ts`           | 2     |
| `convex/testing/verifications.test.ts`      | 11    |     | `convex/testing/crons.test.ts`            | 2     |
| `convex/testing/schema.test.ts`             | 9     |     | `convex/testing/http.test.ts`             | 2     |
| `convex/testing/pushTokens.test.ts`         | 9     |     |                                           |       |
| `convex/testing/verificationNeed.test.ts`   | 9     |     |                                           |       |
| `convex/testing/notificationPolicy.test.ts` | 9     |     |                                           |       |

### Mobile, per suite — 116 cases across 7 files

| Suite                                          | Cases | Story         |
| ---------------------------------------------- | ----- | ------------- |
| `constants/strings.test.ts`                    | 39    | S4-5          |
| `constants/strings-guard.test.ts`              | 4     | S4-5          |
| `components/report/report-draft.test.ts`       | 30    | US-08         |
| `components/report/report-errors.test.ts`      | 14    | US-08         |
| `components/place/verification-tally.test.ts`  | 14    | US-10         |
| `utils/format-relative-time.test.ts`           | 9     | US-08 / US-10 |
| `components/place/verification-errors.test.ts` | 6     | US-10         |

**Repo-wide: 162 + 116 + 18 = 296 across three runners.**

`docs/traceability.md` previously recorded 253 and named the missing `scripts/`
suite as a known gap. That gap is closed by counting it. The same document
records a prior drift where the total was right and the split was not — 29→30 and
15→14 — which is why the per-suite tables above exist rather than a single total.

### No component coverage, anywhere

`apps/mobile` has no component test runner: Vitest there has no DOM and no React
renderer. **Not one screen in this app has ever been rendered by a test.** Every
mobile suite above tests pure logic. The 46 `.tsx` files S4-5 refactored are
type-checked and nothing more, which is why
`docs/plans/S4-5-manual-test-runbook.md` exists and why the 21 unticked boxes in
`docs/traceability.md` are a real gap rather than a formality.

---

## 4. Was any architecture decision revisited?

**No.** Neither ADR-001 nor ADR-002 was reconsidered. The evidence, against
`32f946e` (2026-08-29, the last merge before the window) → `e6379fc`:

```bash
$ git diff 32f946e e6379fc -- packages/backend/convex/schema.ts | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)"
-    .index("by_author", ["authorId"]),
+    .index("by_author", ["authorId"])
+    .index("by_place_and_author", ["placeId", "authorId"]),
```

One net index added, `by_place_and_author`, plus a reordering of the chain so
`by_author` is no longer last. Both are required by US-08's own design — the
24-hour duplicate guard is a single indexed read. This is a story implementing
itself inside the existing entity model, not a change to the model.

Backend files added or removed in the same range:

```bash
$ git diff 32f946e e6379fc --name-status -- packages/backend/convex | grep -E "^[ADR]"
A  packages/backend/convex/reportLimits.ts
A  packages/backend/convex/reports.ts
A  packages/backend/convex/testing/placesSeedData.test.ts
A  packages/backend/convex/testing/reports.test.ts
A  packages/backend/convex/testing/verifications.test.ts
A  packages/backend/convex/verifications.ts
D  packages/backend/convex/seed.test.ts
```

Two new backend modules and three new test files. `seed.test.ts` →
`placesSeedData.test.ts` is a file moved into `convex/testing/`, not a deleted
capability. Nothing was restructured or removed.

### Dependencies

```bash
$ git diff 32f946e e6379fc -- package.json 'apps/mobile/package.json' 'packages/backend/package.json' | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)"
+    "test": "vitest run",
-    "typescript": "~6.0.3"
+    "sf-symbols-typescript": "^2.2.0",
+    "typescript": "~6.0.3",
+    "vitest": "^4.1.10"
```

**Two dev dependencies were added** — `vitest` and `sf-symbols-typescript` — and
a `test` script was added to the root. The `typescript` pair is a line move, not
a version change: the same `~6.0.3`, reordered by Prettier. **No runtime
dependency was added, removed or upgraded.**

So: tooling moved, architecture did not. That distinction matters, because a
reader who sees "two dependencies added" should not conclude a decision was
revisited, and a reader who sees "no decision revisited" should not conclude
nothing changed.

---

## 5. What this file is not

- **Not a claim about what the team did.** It records what is in this repository
  at `e6379fc`. Someone may have written US-09, US-13 or US-16 on a laptop and
  never pushed. "Not in the repository" and "not done" are different statements,
  and only the first is supported here.
- **Not a sprint plan.** It says what exists, not what should have.
- **Not current after `e6379fc`.** Merging the US-11 branch changes section 1 and
  section 4. Re-run the commands; do not edit the conclusions.
- **Not a burndown.** Section 2 explains why it cannot be one.
