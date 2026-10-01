# Traceability Matrix

Story-to-test mapping for Wayble. Seeded from the PRD §9 starter table and
extended as stories land.

**Sprint 3 is mapped below: two stories delivered, five recorded as not
delivered.** US-08 and US-10 have rows. US-09, US-11, US-13, US-16 and US-23 do
not, because the functions PRD §9 names for them are not in `main` — the evidence
is in [`docs/sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md), and a row
asserting a function, screen and test that do not exist would be a fabrication
rather than a traceability record.

The PRD's §9 starter table has 14 rows (US-01 … US-23). The 7 rows outside
Sprint 3 are still outstanding — several of which already have shipped tests
(US-01 `auth.test.ts`, US-02 `users.test.ts`, US-05 `places.test.ts`, US-06
`schema.test.ts`). Their absence from this table is not evidence that they are
untested. The PRD itself is not tracked, so the seeded rows cannot be re-verified
from a fresh clone.

**Owner codes.** The `Owner` column uses `M1`/`M2`/`M3` from PRD §9. **These do
not map cleanly onto the four people**, and the mismatch is worth naming rather
than inheriting: US-13 is coded `M2` but assigned to Nishara Senadheera, while
US-11 (`M3`) and US-23 (`M3`) are split across two people. Read a code as "the
PRD's planning slot", not as a person. Sprint 3's actual assignments:

| Code  | Person             | Sprint 3 stories |
| ----- | ------------------ | ---------------- |
| M1    | Pasindu Lanka      | US-08, US-10     |
| M2    | Pasindu Janith     | US-09, US-16     |
| M2/M3 | Nishara Senadheera | US-11, US-13     |
| M3    | Aathika Ilmudeen   | US-23            |

### Sprint 3 evidence set

Five documents, all written 2026-09-29 for S4-6. They are reachable from each
other so a reader arriving at any one finds the rest.

| Document                                                       | What it holds                                                | Rubric |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ------ |
| [`sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md)   | the dated fact base every other document cites               | both   |
| [`adr/`](./adr/README.md)                                      | ADR-0001 and ADR-0002, reconstructed                         | SE3080 |
| [`sprint-3-burndown.md`](./sprint-3-burndown.md)               | planned against delivered; ClickUp close dates still missing | SE3080 |
| [`sprint-3-retrospective.md`](./sprint-3-retrospective.md)     | what went well, what to improve, six action items            | SE3080 |
| [`EDI-compliance-checklist.md`](./EDI-compliance-checklist.md) | the PRD §6 requirements and their evidence                   | SE3050 |

| Story | Feature                                             | Convex function                                           | Screen / file                                                                                         | Test                                                                                                                                                                                                                                                                                                    | Owner                   |
| ----- | --------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| US-08 | Submit report                                       | `submitReport`                                            | `app/report/[placeId].tsx`, CTA in `app/place/[id]/index.tsx`                                         | `convex/reports.test.ts` (18 cases), `report-draft.test.ts` (30), `report-errors.test.ts` (14)                                                                                                                                                                                                          | M1                      |
| US-10 | Confirm or dispute a report                         | `verifyReport`, `forReport`, `listForPlace`               | `app/place/[id]/reports.tsx`, `components/place/VerifyControl.tsx`, `components/place/ReportCard.tsx` | `convex/verifications.test.ts` (11 cases), `convex/reports.test.ts` (5 `listForPlace`), `verification-tally.test.ts` (14), `verification-errors.test.ts` (6), `format-relative-time.test.ts` (9); `VerifyControl` and `ReportCard` have no automated coverage — `apps/mobile` has no component renderer | M1                      |
| US-09 | Photo evidence — **not delivered in `main`**        | `generateUploadUrl` **absent**                            | no screen                                                                                             | no test file                                                                                                                                                                                                                                                                                            | M2 / Pasindu Janith     |
| US-11 | Confidence level — **on an unmerged branch**        | `computeConfidence` **absent from `main`**                | on `origin/feature/s3-4-…(US-11)`, not merged                                                         | `confidence.test.ts` on that branch, not in `main`                                                                                                                                                                                                                                                      | M3 / Nishara Senadheera |
| US-13 | Flagging — **not delivered in `main`**              | `flagReport` **absent**                                   | no screen                                                                                             | no test file                                                                                                                                                                                                                                                                                            | M2 / Nishara Senadheera |
| US-16 | Needs ranking — **not delivered in `main`**         | match scorer **absent**                                   | no screen                                                                                             | no test file                                                                                                                                                                                                                                                                                            | M2 / Pasindu Janith     |
| US-23 | Live activity feed — **branch predates the sprint** | `recentVerifications` **absent**, including on the branch | no screen                                                                                             | no test file                                                                                                                                                                                                                                                                                            | M3 / Aathika Ilmudeen   |

## Index notes

- `reports` carries three indexes: `by_place`, `by_author`, and
  `by_place_and_author`. The third was added by US-08 so the 24-hour
  duplicate guard is a single indexed read. The S0-5 plan recorded only the
  first two.
- **Both Sprint 3 rows reached `main` on 2026-09-28, ten days after the sprint
  closed on 18 Sep** — in a single merge, `e6379fc`, on a branch named
  `chore/strip-claude-coauthor`. US-08's 44 commits are dated 16 Sep; US-10's 10
  are dated 27 Sep. `main` received no merge at all between 29 Aug and 26 Sep, so
  the sprint's entire output shipped as one event. Evidence and method:
  [`docs/sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md) §2. This
  matters when reading the board's close dates against the repository: they do
  not agree.

## Status

| Story                      | Test coverage                                                                                                                                                                                                    | Known gaps                                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-08                      | 18 Convex cases, 44 mobile cases (62 for this story; 296 repo-wide across three runners)                                                                                                                         | No component test runner; the five report components, the report route, and the report CTA in `app/place/[id]/index.tsx` have no automated coverage, so verification is the manual checklist below                                 |
| US-10                      | `verifications.test.ts` 11 backend cases, plus 5 `reports.listForPlace` cases; `verification-tally`, `verification-errors` and `format-relative-time` are pure modules fully covered by Vitest (29 mobile cases) | `VerifyControl` and `ReportCard` have no automated coverage — `apps/mobile` has no component renderer — so the screen is verified by the manual checklist below; the vote path is covered indirectly through the pure tally module |
| US-09, US-13, US-16, US-23 | none — not implemented in `main`                                                                                                                                                                                 | see the story rows above and `docs/sprint-3-delivery-facts.md`                                                                                                                                                                     |
| US-11                      | `confidence.ts` unit tests exist on `origin/feature/s3-4-…(US-11)`, **not merged**, so `main` has none                                                                                                           | merge or close the branch                                                                                                                                                                                                          |

## Where the numbers come from

**Re-measured 2026-09-29 for S4-6 against `origin/main` at `e6379fc`.** The two
earlier blocks this section used to hold -- one per story, the second explicitly
"not re-measured against the current tree" -- are replaced by this one.
Per-suite counts are in `docs/sprint-3-delivery-facts.md` §3.

```
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

- **Repo-wide: 296 across three runners** -- 162 backend + 116 mobile + 18 in
  `scripts/lib/env-file.test.ts`. The previous figure of 253 predates S4-5, which
  added 43 mobile cases. `scripts/` is still not a turbo workspace, so
  `turbo run test` still reports only the first two, and is not the repo total.
- **The per-story counts in both rows above are still correct**, re-counted from
  the test declarations rather than from the runner's total:

  | Story | backend                                                     | mobile                                                                             | total  |
  | ----- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
  | US-08 | 18 -- `reports.test.ts`, "US-08 report submission"          | 44 -- `report-draft` 30 + `report-errors` 14                                       | **62** |
  | US-10 | 16 -- `verifications.test.ts` 11 + `reports.listForPlace` 5 | 29 -- `verification-tally` 14 + `format-relative-time` 9 + `verification-errors` 6 | **45** |

  `reports.test.ts` holds 23 cases across two `describe` blocks -- 18 US-08 and 5
  `reports.listForPlace` for US-10 -- so the two stories share the file without
  sharing cases. `verifications.test.ts` holds 11 across two: 7 `verifyReport`,
  4 `forReport`.

- `format-relative-time.test.ts` is counted under **both** stories: US-08 wrote
  it, US-10 was the first consumer. So 62 + 45 = 107 exceeds the 116 mobile
  cases by 9 -- counted twice by design, not double-counted in the repo total.
- **Both byte-pinned suites survived S4-5 unchanged.** The refactor that moved
  335 strings into `constants/strings.ts` edited neither
  `utils/format-relative-time.test.ts` nor
  `components/place/verification-tally.test.ts`, and both still pass. That is the
  evidence that moving a string's _home_ did not change its _output_.

## Known gaps

- **Five of the seven Sprint 3 stories are not in `main`.** US-09, US-13 and
  US-16 have no function and no pushed branch. US-11 is complete on an unmerged
  branch. US-23's branch tip is dated 2026-08-29, 9 days _before_ the
  sprint opened, and holds no implementation. Sprint 3's committed output is
  US-08 and US-10. Evidence and method: `docs/sprint-3-delivery-facts.md`.
  **This is a delivery gap, not a testing gap, and no amount of test coverage
  closes it.** The rows above record it rather than leaving the stories blank,
  because a blank reads as an oversight and a row states a fact.
- **`main` received no merge between 2026-08-29 and 2026-09-26.** The whole
  Sprint 3 window sits inside that four-week gap, and both delivered stories
  arrived in one merge on 2026-09-28 — ten days after the sprint closed, on a
  branch named `chore/strip-claude-coauthor`. The board's close dates and the
  repository's do not agree, which matters for anything derived from either.
  See `docs/sprint-3-delivery-facts.md` §2.
- **Neither ADR-001 nor ADR-002 existed as a file until 2026-09-29.** The
  repository referenced both in nine places — though seven of the nine are in
  `docs/PRD-wayble.md` and `docs/sprint_tasks_and_subtasks.md`, which are
  **untracked**, so only two are visible to a fresh clone — including three times as the
  compound "ADR-001/002", and `docs/plans/US-08-submit-an-accessibility-report.md:418`
  noted the gap during Sprint 3 and handed it to S4-6. Both are now written, as
  reconstructions with a provenance note each: `docs/adr/README.md`. The Sprint 0
  retrospective that `docs/PRD-wayble.md:325` says should hold ADR-002's
  rationale still does not exist.

- **No component test runner in `apps/mobile`.** Vitest there has no DOM or
  React renderer configured, so it covers `report-draft.ts` and
  `report-errors.ts` only. `CategoryStep`, `AttributesStep`, `NotesStep`,
  `ConfirmStep`, `StepIndicator` and the `report/[placeId]` route have zero
  automated coverage, as is the report CTA added to
  `app/place/[id]/index.tsx`.
- **`bun run test` at the repo root runs none of US-08's tests.** It executes
  `bun test scripts/` and exits green having run zero US-08 assertions. Use
  `turbo run test`, or the per-workspace commands above.
- **Partly resolved: a step-id rename, and what it would still miss.**
  ~~`STEP_TITLES` is `Record<string, string>` rather than a union keyed by
  `ReportStep`~~ — **fixed in S4-5.** `StepIndicator.tsx` now declares
  `const STEP_TITLES: Record<ReportStep, string> = STRINGS.report.stepTitles`, so
  a renamed step id is a `tsc` error. Two things remain true, and the file's
  comment says so rather than implying otherwise: the assignment site is not a
  fresh object literal, so an **excess** key is still not caught by `tsc`; and
  the key set is now pinned instead by a `stepTitles` test in
  `apps/mobile/constants/strings.test.ts`. The forward transition's `if (title)`
  gate and the ungated back handler are unchanged, so a future source of a
  falsy title would still produce a truncated announcement.
- **`turbo run test` caches results.** A `FULL TURBO` line means the suites were
  not re-executed; pass `--force` to actually run them. This is safe while the
  suites are hermetic — `convex-test` and the pure mobile tests are in-memory —
  and would stop being safe if a test reached the network or a shared database.
  `packages/backend`'s `test` script is also bare `vitest`, so `bun run test`
  inside that workspace starts a watcher in a terminal rather than a single run.
- **Lint asserts nothing about accessibility props.** The repo has no
  `eslint-plugin-jsx-a11y`; a missing `accessibilityLabel` or
  `accessibilityLiveRegion` will not fail `bun run lint`.
- **CI does not run either test suite.** `.github/workflows/ci.yml` has three
  jobs — `lint`, `format`, `typecheck` — and no `test` job. A green CI badge
  is not evidence of test coverage. `turbo run test` now works repo-wide; a
  required status check for it is a separate change.
- **The duplicate guard's atomicity rests on Convex's serializable transactions,
  not on a schema constraint.** Convex has no unique indexes, so nothing in
  `schema.ts` prevents two reports for the same place and author; the guarantee
  comes from the mutation being a serializable transaction that automatically
  retries on conflict, so a losing submission re-reads, sees the winner's
  insert, and is rejected. The risk is therefore not the guard failing today but
  it failing silently later: rewriting the guard onto `by_author` (an unbounded
  scan) or splitting it into a separate function would remove that protection
  with no test failing. A regression test pinning the compound index is the
  cheap guard.
- **The optimistic patch can transiently disagree with the server.** The route
  sends the device clock as `observedAt`; the server accepts values up to 365
  days old (`MAX_OBSERVATION_AGE_MS`); and `places.getPlace` keeps the
  strictly greatest `observedAt` per attribute key. With a skewed device clock
  the server keeps an older report's value and the optimistic display corrects
  itself on the next sync. `getPlace` does not return per-key timestamps, so
  the client cannot detect the disagreement.

## Manual verification checklist

**Still not run** — the 21 boxes below are unticked, because no device
run has been recorded. That is what they are for: an unticked box says the screen
is unverified, where a ticked box nobody ran would be a fabrication. S4-5 added
a second runbook,
[`plans/S4-5-manual-test-runbook.md`](./plans/S4-5-manual-test-runbook.md),
for the 46 screens the strings refactor touched. It is also unrun.

This needs a simulator or device and a signed-in account, so it is a human step. Screen-level behaviour is unverified until every box is
ticked and the result is recorded in the US-08 pull request. The procedure is
[docs/tasks/S3-1-S3-3-manual-test-runbook.md](./S3-1-S3-3-manual-test-runbook.md),
scoped to an iOS Simulator with VoiceOver and one client with two accounts.

**How to run:** [docs/tasks/S3-1-S3-3-manual-test-runbook.md](./S3-1-S3-3-manual-test-runbook.md).

- [ ] Signed-out user sees "Sign in to submit a report" with a working sign-in action — runbook S3-1-A
- [ ] Signed-in user reaches the form from the place detail CTA — runbook S3-1-B
- [ ] Steps 1→2→3→4 advance and the step indicator reads correctly at each step — runbook S3-1-C
- [ ] Step 2 blocks "Next" while a `partial` attribute has an empty note — runbook S3-1-D
- [ ] Submitting succeeds and returns to the place detail already showing the new attributes — runbook S3-1-E
- [ ] A second submission within 24 hours shows the plain-language duplicate message — runbook S3-1-F
- [ ] Offline submit reverts the optimistic patch and announces the failure — runbook S3-1-G
- [ ] VoiceOver and TalkBack announce each step transition and each value change — runbook S3-1-H
- [ ] Hardware back moves back one step, then leaves the form — runbook S3-1-I
- [ ] Light and dark mode both legible on all four steps — runbook S3-1-J
- [ ] 200% font scale causes no clipping (WCAG 1.4.4) — runbook S3-1-K
- [ ] All touch targets ≥ 44×44 dp (WCAG 2.5.8) — runbook S3-1-L

### US-10 — confirm or dispute a report

These nine are the **only** verification `VerifyControl`, `ReportCard` and
`app/place/[id]/reports.tsx` will get: `apps/mobile` has no component renderer,
so nothing below can fail a test. Each is worded as something a human can do
and observe. The last three exist because review found defects that no type
checker or linter could see — an invisible focus ring that passed both `tsc`
and `eslint` twice, an announce gate whose bug is only observable by racing two
taps, and a signed-out screen that read as a dead end.

**How to run:** [docs/tasks/S3-1-S3-3-manual-test-runbook.md](./S3-1-S3-3-manual-test-runbook.md).

- [ ] A signed-in user can confirm and dispute another user's report, and change their mind — runbook S3-3-A
- [ ] A second signed-in user sees the first user's vote with no manual refresh — runbook S3-3-B
- [ ] Your own report shows disabled controls with a visible reason, and voting on it via any client is rejected — runbook S3-3-C
- [ ] No author email address appears in any reports response — runbook S3-3-D
- [ ] The reports list length matches the `N reports` badge on the place detail — runbook S3-3-E
- [ ] VerifyControl passes screen reader, 200% font scale, and 44×44 dp checks — runbook S3-3-F
- [ ] Keyboard-focus both Agree and Dispute in both the selected and unselected states, in light and dark mode, and confirm the focus ring is visible in all four combinations and changes with the state — runbook S3-3-G
- [ ] Rapid double-tap across the two buttons so the attempts interleave, and confirm at most one announcement is heard and no stale success is announced over a failure — runbook S3-3-H
- [ ] Sign out, open the reports screen from the place detail, and confirm a sign-in affordance appears rather than a dead end — runbook S3-3-I
