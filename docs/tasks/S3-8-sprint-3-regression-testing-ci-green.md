# S3-8 Tasks: Sprint 3 Regression Testing & CI Green

**Related plan:** [`docs/plans/S3-8-sprint-3-regression-testing-ci-green.md`](../plans/S3-8-sprint-3-regression-testing-ci-green.md)

## 1. Automated Checks

- [x] Run `tsc --noEmit` across the workspace (`bun run check-types` clean ✓)
- [x] Run `bun run lint` (backend + mobile clean ✓)
- [x] Run the full `convex-test` suite via `npx vitest run` in `packages/backend` (16 files, 124/124 passed ✓)
- [x] `.github/workflows/ci.yml` — Add `test` job so backend and script tests run on every PR

## 2. Manual Testing

- [ ] Manual E2E: sign up → submit report → attach photo → verify → see confidence update → see live feed update
- [ ] Auth gates on submit, verify, and flag — iOS simulator
- [ ] Auth gates on submit, verify, and flag — Android simulator

## 3. Board Hygiene

- [ ] ClickUp: close the Sprint 3 list
- [ ] ClickUp: move carry-overs to the Sprint 4 backlog (see below)

## 4. Carry-over Candidates for Sprint 4

- [ ] Decide on the guest-user fallback in `submitVerification` / `submitPlaceVerification` (blocks the "verify" auth gate)
- [ ] Flag mutation (`flags` table exists, no mutation yet)
- [ ] Report creation and photo attachment mutations, if not merged from another branch
- [ ] Add a place picker UI polish and nearest-first ordering for the verification modal fallback list

## 5. Notes

- `bun run format:check` shows many files locally on Windows because `core.autocrlf=true` converts LF to CRLF. The repo stores LF, so Linux CI is not affected. S3-7 files pass with `npx prettier --check --end-of-line auto`.
- Run the app in the **development build** (`com.wayble.mobile`), not Expo Go: `expo-notifications` Android push support was removed from Expo Go in SDK 53.
