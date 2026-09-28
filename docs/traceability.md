# Traceability Matrix

Story-to-test mapping for Wayble. Seeded from the PRD §9 starter table and
extended as stories land.

US-08 and US-10 are mapped so far. The PRD's §9 starter table has 14 rows
(US-01 … US-23) and the other 12 are outstanding — several of which already
have shipped tests (US-01 `auth.test.ts`, US-02 `users.test.ts`, US-05
`places.test.ts`, US-06 `schema.test.ts`). Their absence from this table is
not evidence that they are untested. The PRD itself is not tracked, so the
seeded rows cannot be re-verified from a fresh clone.

| Story | Feature                     | Convex function                             | Screen / file                                                                                         | Test                                                                                                                                                                                                                                                                                                    | Owner |
| ----- | --------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| US-08 | Submit report               | `submitReport`                              | `app/report/[placeId].tsx`, CTA in `app/place/[id]/index.tsx`                                         | `convex/reports.test.ts` (18 cases), `report-draft.test.ts` (30), `report-errors.test.ts` (14)                                                                                                                                                                                                          | M1    |
| US-10 | Confirm or dispute a report | `verifyReport`, `forReport`, `listForPlace` | `app/place/[id]/reports.tsx`, `components/place/VerifyControl.tsx`, `components/place/ReportCard.tsx` | `convex/verifications.test.ts` (11 cases), `convex/reports.test.ts` (5 `listForPlace`), `verification-tally.test.ts` (14), `verification-errors.test.ts` (6), `format-relative-time.test.ts` (9); `VerifyControl` and `ReportCard` have no automated coverage — `apps/mobile` has no component renderer | M1    |

## Index notes

- `reports` carries three indexes: `by_place`, `by_author`, and
  `by_place_and_author`. The third was added by US-08 so the 24-hour
  duplicate guard is a single indexed read. The S0-5 plan recorded only the
  first two.

## Status

| Story | Test coverage                                                                                                                                                                                                    | Known gaps                                                                                                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-08 | 18 Convex cases, 44 mobile cases (151 in the two vitest suites)                                                                                                                                                  | No component test runner; the five report components, the report route, and the report CTA in `app/place/[id]/index.tsx` have no automated coverage, so verification is the manual checklist below                                 |
| US-10 | `verifications.test.ts` 11 backend cases, plus 5 `reports.listForPlace` cases; `verification-tally`, `verification-errors` and `format-relative-time` are pure modules fully covered by Vitest (29 mobile cases) | `VerifyControl` and `ReportCard` have no automated coverage — `apps/mobile` has no component renderer — so the screen is verified by the manual checklist below; the vote path is covered indirectly through the pure tally module |

## Where the numbers come from

```
$ cd packages/backend && bunx vitest run
 Test Files  12 passed (12)
      Tests  107 passed (107)

$ cd apps/mobile && bunx vitest run
 Test Files  2 passed (2)
      Tests  44 passed (44)
```

- 18 of the 107 backend tests are in `convex/reports.test.ts`; the other 89 are
  the pre-existing suites, untouched by US-08 (`git diff main...HEAD -- '*test*'`
  returns only the three files this story added or created). They were not
  re-verified against `main` in this task.
- The 44 mobile tests split 30 in `report-draft.test.ts` and 14 in
  `report-errors.test.ts`. Both files test pure logic only. **Both** recorded
  counts have since drifted — 29 → 30 and 15 → 14 — so the total of 44 stayed
  right while the split did not. US-10 left both files untouched, so the drift
  is not accounted for here; it was found by recounting the two files for the
  US-10 row above.
- `turbo run test` runs both vitest workspaces and reports 151 passing tests.
- **That is not the repo total.** A third suite, `scripts/lib/env-file.test.ts`
  (17 `bun:test` cases), runs under the root `bun run test`. `scripts/` is not a
  turbo workspace, so `turbo run test` excludes it. Repo-wide there are 168
  tests across three runners, not 151.

### Where the US-10 numbers come from

Re-measured for this story; the block above is US-08's and has not been
re-measured against the current tree.

```
$ cd packages/backend && bunx vitest run
 Test Files  17 passed (17)
      Tests  162 passed (162)

$ cd apps/mobile && bunx vitest run
 Test Files  5 passed (5)
      Tests  73 passed (73)
```

- `verifications.test.ts` holds 11 cases: 7 under `verifications.verifyReport`
  and 4 under `verifications.forReport`. The 7th `verifyReport` case,
  "a different user can verify the report", was added during a fix round after
  the plan recorded 6, so an earlier draft of the US-10 row said 10.
- `reports.test.ts` grew from 18 to 23; the 5 new ones are all
  `reports.listForPlace`.
- The 29 US-10 mobile cases split 14 in `verification-tally.test.ts`, 9 in
  `format-relative-time.test.ts` and 6 in `verification-errors.test.ts`. All
  three files test pure logic only; none of them renders a component.
- Backend total moved 151 → 162 and the mobile total 44 → 73, so the repo-wide
  figure is now 253 across three runners (162 + 73 + 18 in
  `scripts/lib/env-file.test.ts`, which is 18 rather than the 17 recorded
  above).

## Known gaps

- **No component test runner in `apps/mobile`.** Vitest there has no DOM or
  React renderer configured, so it covers `report-draft.ts` and
  `report-errors.ts` only. `CategoryStep`, `AttributesStep`, `NotesStep`,
  `ConfirmStep`, `StepIndicator` and the `report/[placeId]` route have zero
  automated coverage, as is the report CTA added to
  `app/place/[id]/index.tsx`.
- **`bun run test` at the repo root runs none of US-08's tests.** It executes
  `bun test scripts/` and exits green having run zero US-08 assertions. Use
  `turbo run test`, or the per-workspace commands above.
- **A step-id rename would silently disable the step announcements.**
  `report/[placeId].tsx` gates the forward transition on `if (title)`, and
  `STEP_TITLES` is `Record<string, string>` rather than a union keyed by
  `ReportStep`, so a renamed id makes the lookup miss and the announcement
  never fire. The back handler and `StepIndicator` are ungated and would
  announce a truncated "Step 2 of 4: ". `STEP_TITLES` has no test. A one-line
  assertion that every `REPORT_STEPS` entry has a title would turn a silent
  accessibility regression into a red test.
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

Not yet run. This needs a simulator or device and a signed-in account, so it
is a human step. Screen-level behaviour is unverified until every box is
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
