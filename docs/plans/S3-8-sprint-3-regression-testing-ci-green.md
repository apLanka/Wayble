# S3-8: Sprint 3 Regression Testing & CI Green

**Sprint 3 · Release Readiness · Owner: Fullstack**

As the team closing Sprint 3, we confirm that everything shipped in the sprint still works together and that the CI pipeline is green on every pull request, so Sprint 4 starts from a trustworthy baseline.

---

## 1. Context & Objectives

Sprint 3 added the live community feed (S3-7) on top of the Sprint 1–2 foundations (auth, places, reports, verification-need notifications). Before closing the sprint we need evidence that nothing regressed and that CI enforces it.

### Sub-tasks

1. **Type check**: run `tsc --noEmit` across the workspace and resolve all type errors.
2. **Backend suite**: run the full `convex-test` suite and keep all tests green.
3. **Manual E2E**: sign up → submit report → attach photo → verify → see confidence update → see live feed update.
4. **Auth gates**: confirm submit, verify, and flag reject unauthenticated callers, on iOS and Android simulators.
5. **Board hygiene**: close the Sprint 3 list in ClickUp and move carry-overs to the Sprint 4 backlog.

---

## 2. CI Pipeline

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on every pull request.

| Job         | Command                                                       | Status               |
| :---------- | :------------------------------------------------------------ | :------------------- |
| `lint`      | `bun run lint`                                                | Existing             |
| `format`    | `bun run format:check`                                        | Existing             |
| `typecheck` | `bun run check-types`                                         | Existing             |
| `test`      | `bunx vitest run` (backend) and `bun run test` (root scripts) | **NEW** in this task |

Before this task the test suite was never run in CI, so a failing backend test could still merge. The new `test` job closes that gap.

> Note: `bun run format:check` reports many files on Windows checkouts because `core.autocrlf=true` turns LF files into CRLF in the working tree. The repository stores LF, so Linux CI is unaffected. Use `npx prettier --check --end-of-line auto <files>` to check locally.

---

## 3. Regression Checklist

### A. Automated

- [ ] `bun run check-types` — 0 errors (backend + mobile).
- [ ] `bun run lint` — clean.
- [ ] `cd packages/backend && npx vitest run` — all test files pass.
- [ ] `bun run test` — root script tests pass.
- [ ] CI `lint`, `format`, `typecheck`, `test` all green on the PR.

### B. Manual E2E (dev build, not Expo Go)

1. Start backend (`bun run dev` in `packages/backend`) and seed (`bun run seed`).
2. Start the app with `npx expo start --dev-client --host lan --clear` and open the Wayble dev build.
3. Sign up and log in.
4. Open a place and submit a report; attach a photo.
5. Verify the place from a second account or device.
6. Confirm the confidence badge updates.
7. Open **Live Feed** on the first device and confirm the verification appears without refreshing (see the S3-7 two-device protocol).

### C. Auth gates (iOS and Android simulators)

For each of **submit report**, **verify**, and **flag**:

- [ ] Signed out → the action is rejected with a clear message, no row is written.
- [ ] Signed in → the action succeeds and the row is written.

---

## 4. Known Gaps Found During Regression

| #   | Finding                                                                                                                                                      | Impact                                                                           | Proposed handling                                                                                        |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| 1   | `submitVerification` and `submitPlaceVerification` in `verifications.ts` fall back to a shared guest user when signed out (added in S3-7 for the demo flow). | Signed-out users can write verifications; fails the "auth gate on verify" check. | Decide: remove the fallback for production, or keep it behind a dev-only flag. Needs a product decision. |
| 2   | The `flags` table exists in `schema.ts` but no flag mutation exists in the backend.                                                                          | The "flag" auth gate cannot be tested.                                           | Carry over to Sprint 4 unless the flag work lives on another branch.                                     |
| 3   | No report-creation or photo-attachment mutation exists on this branch (reports are only created as demo reports by `submitPlaceVerification`).               | Manual E2E steps 4 (report and photo) cannot be run end to end here.             | Confirm where this work lives; carry over to Sprint 4 if not merged.                                     |

---

## 5. File Changes Summary

| Layer | File                                                      | Action | Description                                          |
| :---- | :-------------------------------------------------------- | :----- | :--------------------------------------------------- |
| CI    | `.github/workflows/ci.yml`                                | MODIFY | Add `test` job running backend and script unit tests |
| Docs  | `docs/plans/S3-8-sprint-3-regression-testing-ci-green.md` | NEW    | This plan                                            |
| Docs  | `docs/tasks/S3-8-sprint-3-regression-testing-ci-green.md` | NEW    | Task checklist and results                           |
