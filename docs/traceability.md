# Traceability Matrix

Story-to-test mapping for Wayble. Seeded from the PRD §9 starter table and
extended as stories land.

| Story | Feature       | Convex function | Screen / file                                           | Test                                                                                           | Owner |
| ----- | ------------- | --------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| US-08 | Submit report | `submitReport`  | `app/report/[placeId].tsx`, CTA in `app/place/[id].tsx` | `convex/reports.test.ts` (18 cases), `report-draft.test.ts` (29), `report-errors.test.ts` (15) | M1    |

## Index notes

- `reports` carries three indexes: `by_place`, `by_author`, and
  `by_place_and_author`. The third was added by US-08 so the 24-hour
  duplicate guard is a single indexed read. The S0-5 plan recorded only the
  first two.

## Status

| Story | Test coverage                                                   | Known gaps                                                                                                                                                                                   |
| ----- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-08 | 18 Convex cases, 44 mobile cases (151 in the two vitest suites) | No component test runner; the five report components, the report route, and the report CTA in `app/place/[id].tsx` have no automated coverage, so verification is the manual checklist below |

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
  the pre-existing suites, unchanged by US-08.
- The 44 mobile tests split 29 in `report-draft.test.ts` and 15 in
  `report-errors.test.ts`. Both files test pure logic only.
- `turbo run test` runs both vitest workspaces and reports 151 passing tests.
- **That is not the repo total.** A third suite, `scripts/lib/env-file.test.ts`
  (17 `bun:test` cases), runs under the root `bun run test`. `scripts/` is not a
  turbo workspace, so `turbo run test` excludes it. Repo-wide there are 168
  tests across three runners, not 151.

## Known gaps

- **No component test runner in `apps/mobile`.** Vitest there has no DOM or
  React renderer configured, so it covers `report-draft.ts` and
  `report-errors.ts` only. `CategoryStep`, `AttributesStep`, `NotesStep`,
  `ConfirmStep`, `StepIndicator` and the `report/[placeId]` route have zero
  automated coverage, as is the report CTA added to
  `app/place/[id].tsx`.
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
ticked and the result is recorded in the US-08 pull request.

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
