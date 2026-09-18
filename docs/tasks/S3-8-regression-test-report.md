# S3-8 Regression Test Report & Evidence

**Related plan:** [`docs/plans/S3-8-sprint-3-regression-testing-ci-green.md`](../plans/S3-8-sprint-3-regression-testing-ci-green.md)
**Task list:** [`docs/tasks/S3-8-sprint-3-regression-testing-ci-green.md`](S3-8-sprint-3-regression-testing-ci-green.md)

- **Date:** 2026-10-02
- **Base commit:** `e9a6698` (plus uncommitted S3-7 and S3-8 working-tree changes)
- **Environment:** Windows 11, bun 1.3.14, Node 24
- **Backend deployment:** `youthful-partridge-155`

---

## 1. Automated Results

| Check                       | Command                                 | Result                                       |
| :-------------------------- | :-------------------------------------- | :------------------------------------------- |
| Type check (all workspaces) | `bun run check-types`                   | PASS — 0 errors (backend + mobile)           |
| Lint                        | `bun run lint`                          | PASS — clean (backend + mobile)              |
| Backend unit tests          | `cd packages/backend && npx vitest run` | PASS — 16 files, 124/124 tests               |
| Root script tests           | `bun run test`                          | PASS — 18/18 tests                           |
| Format                      | `bun run format:check`                  | Local FAIL (CRLF only); S3-7/S3-8 files PASS |

The local format failure is caused by `core.autocrlf=true` converting LF to CRLF on Windows. The repo stores LF, so Linux CI is not affected. Changed files were checked with `npx prettier --check --end-of-line auto <files>` and pass.

### Backend tests per file

| File                                        | Passed      |
| :------------------------------------------ | :---------- |
| `convex/seed.test.ts`                       | 3/3         |
| `convex/testing/accessibility.test.ts`      | 5/5         |
| `convex/testing/auth.test.ts`               | 4/4         |
| `convex/testing/crons.test.ts`              | 2/2         |
| `convex/testing/health.test.ts`             | 2/2         |
| `convex/testing/http.test.ts`               | 2/2         |
| `convex/testing/notificationCopy.test.ts`   | 7/7         |
| `convex/testing/notificationPolicy.test.ts` | 9/9         |
| `convex/testing/notifications.test.ts`      | 12/12       |
| `convex/testing/places.test.ts`             | 11/11       |
| `convex/testing/pushTokens.test.ts`         | 9/9         |
| `convex/testing/schema.test.ts`             | 9/9         |
| `convex/testing/sweep.test.ts`              | 15/15       |
| `convex/testing/users.test.ts`              | 20/20       |
| `convex/testing/verificationNeed.test.ts`   | 9/9         |
| `convex/testing/verifications.test.ts`      | 5/5         |
| **Total**                                   | **124/124** |

---

## 2. CI Evidence

- `.github/workflows/ci.yml` now has a `test` job (backend `vitest run` and root `bun run test`) next to `lint`, `format`, and `typecheck`.
- [ ] Attach the GitHub Actions run link or screenshot showing all four jobs green on the PR: **\_\_\_\_\_\_**

---

## 3. Manual E2E Evidence (to be completed on device)

Use the dev build (`com.wayble.mobile`), not Expo Go.

| Step | Expected                              | Result | Screenshot / notes |
| :--- | :------------------------------------ | :----- | :----------------- |
| 1    | Sign up and log in                    |        |                    |
| 2    | Submit a report                       |        |                    |
| 3    | Attach a photo                        |        |                    |
| 4    | Verify the place                      |        |                    |
| 5    | Confidence badge updates              |        |                    |
| 6    | Live Feed shows the verification live |        |                    |

---

## 4. Auth Gate Evidence (to be completed on device)

| Action        | Signed out (expected: rejected)   | Signed in (expected: succeeds) | iOS | Android |
| :------------ | :-------------------------------- | :----------------------------- | :-- | :------ |
| Submit report |                                   |                                |     |         |
| Verify        | **Known gap #1** (guest fallback) |                                |     |         |
| Flag          | **Known gap #2** (no mutation)    |                                |     |         |

---

## 5. Known Gaps

See section 4 of the plan. Summary:

1. `submitVerification` / `submitPlaceVerification` fall back to a guest user when signed out.
2. The `flags` table exists but there is no flag mutation.
3. No report-creation or photo-attachment mutation exists on this branch.
