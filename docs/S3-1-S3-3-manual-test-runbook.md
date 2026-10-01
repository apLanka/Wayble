# Manual test runbook — S3-1 (US-08) and S3-3 (US-10)

- **Stories:** S3-1 / `z8v0kmrg21` / US-08 submit an accessibility report · S3-3 / `z8v0kmrg23` / US-10 confirm or dispute a report
- **Platform:** iOS Simulator + VoiceOver, one client with two accounts
- **Tester:** _(leave blank)_
- **Date:** _(leave blank)_

Why this exists:

- `docs/traceability.md` records 21 unticked manual boxes — 12 for US-08, 9 for US-10 — and states the result must be recorded in the US-08 pull request.
- `apps/mobile` has no component test runner (Vitest there has no DOM or React renderer configured), so the wizard route, `VerifyControl`, `ReportCard` and `app/place/[id]/reports.tsx` have **zero** automated coverage.
- This runbook is therefore the only verification those screens will get. Execute it top to bottom, quote the literal screen text for every failure, and fill in section 9.

## 1. Prerequisites

- macOS with Xcode and an iOS Simulator runtime. Bun — `packageManager` is `bun@1.3.1`.
- A Convex dev deployment, provisioned once per machine (`bun run --filter @packages/backend setup`, interactive).
- **Not** required: a location permission, a Mapbox token, or a second device. The runbook reaches places through the debug screen precisely because the nearby list and the map are both gated on a location fix.

## 2. Bring the stack up

1. Dependencies (skip if `node_modules` already exists):

   ```bash
   bun install
   ```

   Expected: resolves and installs. Failure mode: no `bun` on `PATH` → install Bun first.

2. **Terminal A**, repo root:

   ```bash
   bun run dev
   ```

   This runs `scripts/sync-convex-env.ts` and then `turbo run dev`, which starts `convex dev` and `expo start`.

   Expected first line: `[sync-convex-env] wrote EXPO_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud`, or `[sync-convex-env] already up to date`.

   Failure mode: the script exits 1 with `CONVEX_URL is missing from packages/backend/.env.local`. Run `bun run --filter @packages/backend setup` (interactive; choose a Convex **Cloud** dev deployment) and start `bun run dev` again. Note that a machine set up by hand may carry `VITE_CONVEX_URL` rather than `CONVEX_URL`; `resolveConvexUrl` in `scripts/lib/env-file.ts` accepts either, so the sync succeeds as written. **Do not** add a `CONVEX_URL` line to fix this.

3. **Terminal B**, `apps/mobile`:

   ```bash
   npx expo run:ios
   ```

   This builds and installs the dev client on the booted simulator. `bun run dev` only starts Metro, so on iOS this second command is required. `apps/mobile/ios` is git-ignored; on a fresh clone run `npx expo prebuild -p ios` first.

   Failure mode: no simulator booted → open Simulator.app and pick a device, then re-run.

4. Repo root:

   ```bash
   bun run seed
   ```

   (= `convex run seed:seedPlaces`.) Expected: 155 places in the dataset — the first run inserts them, every later run reports 155 skipped. It is idempotent and needs no auth. 16 of those places receive one seeded report each, authored by `seed@wayble.app` with display name **Wayble Seeder**, carrying the summary "Initial verified accessibility assessment." and eight attributes.

5. Smoke check in the app: **Settings** tab → scroll to the **Developer** card → **Open debug screen**. A server timestamp appears (not the "Connecting to Convex…" alert) and tapping **Touch** increments the counter with no refresh. If it hangs on "Connecting to Convex…", terminal A is not up. If you are on a **local** Convex and the iOS Simulator cannot reach it, set `CONVEX_URL_OVERRIDE` in `packages/backend/.env.local` per the README and restart `bun run dev`.

## 3. Accounts

Two throwaway accounts, created through the normal sign-up screen. There is no dev login, no `__DEV__` bypass and no seeded human password anywhere in the repo.

| Role              | Email                  | Password        |
| ----------------- | ---------------------- | --------------- |
| A — report author | `m1.alice@wayble.test` | `waybleManual1` |
| B — verifier      | `m1.bob@wayble.test`   | `waybleManual1` |

Path: first launch routes to `/onboarding` (the flag lives in SecureStore as `has_seen_onboarding`, so it appears once per simulator install). Tap **Get Started** → **Create Account**. Sign-up lowercases and trims the email, needs ≥ 8 characters and a matching confirmation, and sends no verification mail, so the second account is the same two-field form.

To switch accounts later: **Settings** tab → **Sign Out** (there is an identical button on the **Profile** tab; either works) → land on `/sign-in`.

## 4. Pick the two places

A deterministic route that does not depend on a simulated GPS fix: **Open debug screen** → **View all places →** (`/debug/places`, backed by `places.listAll`, so it lists all 155 regardless of location) → tap a card → `/place/<id>`.

- **P1 — empty place**, for the S3-1 empty-state CTA: **Cinnamon Lakeside Hotel** or **Cafe Lavinia**. Neither name matches the seed's demo-report pattern (`/SLIIT|Hospital|Mall|Park|Station|Cargills/i`), so both start with zero reports and show the **Contribute Accessibility Info** empty state.
- **P2 — seeded place**, for the supplementary check: **Cargills Food City** or **Colombo General Hospital**. Both carry exactly one seeded report, bylined _Wayble Seeder_.

**Record the 24-hour rule before starting.** `reports.submitReport` rejects a second report on the same place by the same user inside 24 h (`DUPLICATE_WINDOW_MS` in `packages/backend/convex/reportLimits.ts`). If a step fails because a previous run already reported on the chosen place with that account, switch to another P1 — do not clear the database.

## 5. S3-1 script — steps `S3-1-A` … `S3-1-L`

Each step is **Do** (concrete taps) / **Expect** (the literal string or state that must appear). These twelve map one-to-one onto the twelve unticked US-08 boxes in `docs/traceability.md`, in the same order.

### S3-1-A — signed-out gate

**Do:** Settings → **Sign Out**. Open P1 from `/debug/places` and tap **Contribute Accessibility Info**.

**Expect:** the heading "Sign in to submit a report"; the body "Reports are tied to your account so other people can confirm or dispute what you observed."; a **Sign in** button (`accessibilityLabel` "Go to sign in"). Tap it → `/sign-in`.

### S3-1-B — entry points

**Do:** Sign in as A. On the empty P1 the CTA reads **Contribute Accessibility Info**; on a place that already has attributes it reads **Add or correct this report**. Both push `/report/<placeId>`.

**Expect:** header title "Report accessibility" and the wizard's own first step. Navigate back and re-enter: no data loss from having visited a later step (nothing is written until submit).

### S3-1-C — steps 1→4

**Do:** Walk the four steps with no attribute set.

**Expect:** step 1 header "What would you like to report?" with six group pills (Mobility, Vision, Hearing, Communication, Sensory, Assistance). Tapping a pill advances immediately. The indicator reads, verbatim, `Step 1 of 4 — Category`, then `Step 2 of 4 — Attributes`, `Step 3 of 4 — Notes`, `Step 4 of 4 — Confirm`; the line "Reporting on <place name>" sits under it on every step. With VoiceOver on, the indicator is one `progressbar` and speaks "Step 2 of 4, progress bar, Attributes" — position once, not twice.

### S3-1-D — a partial blocks Next

**Do:** On step 2 in Mobility, set **Elevator** to **Partial**.

**Expect:** a note field appears labelled "Add a note — required for Partial" in the danger colour, and **Next** is disabled. Type a note → **Next** enables. Then clear that note again, tap **Back** to step 1, choose **Vision**, and tap the **Vision** pill.

**Expect** on arrival at step 2 (Vision): the alert banner

```
A note is still required for 1 attribute in Mobility. Go back and choose Mobility to add it.
```

**Next** stays disabled, and the blocking attribute is not on this step. This banner is the only route to the cause, so it is the item under test: if the disabled button has no explanation here, that is a FAIL. (The pill advances you; the banner is already on screen when you land, and **Next** cannot be pressed at all.)

### S3-1-E — submit succeeds

**Do:** Set **Step-free Entrance** to **Available** in Mobility and clear the Elevator partial, then **Next** → step 3.

**Expect:** the summary box is optional and its counter reads "N of 500 characters left", reaching 0 but never below. Type a summary, then **Next** to step 4.

**Expect:** step 4 recaps the group, every attribute with its value and note, and the summary. Tap **Submit report** (label "Submit report", hint "Saves your accessibility report for this place."); the label becomes "Submitting…" while in flight.

**Expect:** you land back on the place detail already showing the new attributes under their group headings, the count badge now reading **1 report**, and VoiceOver announcing "Report submitted. Thank you."

### S3-1-F — duplicate guard

**Do:** From the same place detail tap **Add or correct this report**, walk 1→4 again, submit.

**Expect:** the `accessibilityRole="alert"` banner

```
You already reported on this place today. You can add another report tomorrow.
```

Plain language — never the server's `Duplicate report: …`.

### S3-1-G — offline rollback

**Do:** Use a _third_ place with no report from A, so the duplicate guard cannot pre-empt the failure. Build a draft, reach step 4, then in **Terminal A** press `Ctrl-C` to stop Convex, then tap **Submit report**.

**Expect:** within a few seconds the banner "We couldn't submit your report. Please try again." and VoiceOver reading the same sentence. Navigate back to the place detail and confirm the new attribute is **absent** — Convex reverted the optimistic patch.

Restart with `bun run dev` afterwards. If no banner appears within 30 s, record the item as FAIL with what was on screen instead; do not record it as untested.

### S3-1-H — VoiceOver on the wizard

**Do:** With VoiceOver on, swipe the whole wizard.

**Expect:** each step transition announces `Step N of 4: <Title>`; each value pill announces "<Attribute label>: <Value label>" with the checked state, e.g. "Elevator: Partial, radio, selected"; the note field announces "Note for Elevator"; the error banner announces as an alert. Record any announcement that is missing or spoken twice.

### S3-1-I — hardware back (Android only)

**Do:** Nothing. This item is **not testable on iOS**: the handler is React Native's `BackHandler`, which only fires on an Android hardware back press, and the iOS header chevron pops the whole route rather than one wizard step.

**Expect:** record this line as "Not applicable — Android only", with that reason. Do not tick it.

### S3-1-J — light and dark

**Do:** The theme follows the device appearance (Settings → Current theme says so; there is no in-app toggle). Flip it from the shell:

```bash
xcrun simctl ui booted appearance dark
xcrun simctl ui booted appearance light
```

Re-walk all four steps in each mode.

**Expect:** no invisible text and no unreadable banner in either mode.

### S3-1-K — large text

**Do:** In the simulator's Settings app → Accessibility → Display & Text Size → **Larger Text**, drag to the step nearest 200%. **Record the step name you actually set.** Walk all four steps and the footer.

**Expect:** no clipping and no clipped submit label. If the slider cannot reach ~200%, record the achieved step and mark the item **partial**, not pass.

### S3-1-L — 44×44 dp touch targets

**Do:** Measure, do not eyeball. Xcode → Open Developer Tool → **Accessibility Inspector**, attach to the booted simulator, select each control (the six group pills, every value pill, Back, Next, the summary field, **Submit report**), read its frame, and confirm the smaller dimension is ≥ 44 pt.

**Expect:** all ≥ 44 pt. `TouchTarget` enforces `minWidth/minHeight: 44` (`sizing.minTouchTarget` in `apps/mobile/constants/theme.ts`), so any control below 44 is a real finding — record the control and the measured frame.

## 6. S3-3 script — steps `S3-3-A` … `S3-3-I`

Nine steps, in the order below, mapping one-to-one onto the nine unticked US-10 boxes in `docs/traceability.md`. The ordering is load-bearing: it gives each account a report it does not own, so every vote in the script is legal.

**Setup before the first step, signed in as B:** open P1 from `/debug/places` and submit a report through the same wizard (Mobility → **Step-free Entrance** = **Available** → **Next** → … → **Submit report**). P1 now has two reports: A's and B's.

### S3-3-A — confirm, dispute, change mind

**Do:** On P1's place detail tap the **1 report** … now **2 reports** badge (label "2 reports on this place", hint "Opens the list of reports so you can confirm or dispute them") to reach `/place/<id>/reports`. On **A's** card (B does not own it) tap **Confirmed**, then **Disputed**, then **Confirmed** again.

**Expect:** the list header reads `2 reports`, matching the badge. The tally becomes `1 confirmed`, the button is pressed, and VoiceOver says "Report confirmed."; then `1 disputed` and "Report disputed."; then `1 confirmed`. The tally is a single text node, and the selection is shown by pressed styling _and_ `accessibilityState.selected`, never by colour alone.

### S3-3-B — persistence (not a live push)

**Do:** Settings → **Sign Out** → sign in as A → reopen the same reports screen (P1 → **2 reports** badge).

**Expect:** A's card is headed **Your report** and its tally line reads `You can't verify your own report · 1 confirmed` — which proves the vote was written server-side and read back by a different user.

**Scope limit:** it does **not** prove a live push. One simulator has one client, so the cross-device no-refresh demo (ClickUp `z8v0kmrj4p`) is not covered by this run. Record this line as _partial — persistence proven, live push needs a second client_, and say so in the result.

### S3-3-C — own report is disabled with a reason

**Do:** On the same screen, inspect A's card. Then, to show the server also refuses, from the repo root run `npx convex dashboard` → **Functions** → run `verifications:verifyReport` with A's report id.

**Expect:** on A's card, both buttons at reduced opacity, announced disabled, with the visible reason "You can't verify your own report · 1 confirmed". A control that vanished would be the defect this item guards against.

**Expect** from the dashboard: a rejection. The dashboard runs unauthenticated, so it comes back `Unauthenticated: must be logged in to verify a report` — that proves the server check runs, not that it is a self-report check. Record the self-verification rejection itself (`Cannot verify your own report`) as covered by `packages/backend/convex/testing/verifications.test.ts`, test "rejects self-verification and writes no row": no client path can reach it, because the UI disables the control.

### S3-3-D — no author email

**Do:** Read every card on the screen.

**Expect:** the byline is a display name only — "Your report" for A's own, and for B's report the fallback **A Wayble user**, because sign-up collects no name and `listForPlace` falls back rather than rendering a blank byline. No email address appears on any card. Do **not** record the Settings tab's own email row as a failure — that is the account screen, not a report.

### S3-3-E — list length matches the badge

**Do:** Check P1, then P2 (**Cargills Food City**).

**Expect:** on P1 the place-detail badge reads `2 reports` and the reports screen header reads `2 reports`, with exactly two cards. On P2 the badge reads `1 report` and the header `1 report`, with one card bylined _Wayble Seeder_ carrying the summary "Initial verified accessibility assessment.", its eight attribute chips, and a relative time such as `3 d ago` that reads "Reported 3 d ago" to VoiceOver.

### S3-3-F — screen reader, large text, 44 pt

**Do:** Repeat S3-1-H, S3-1-K and S3-1-L against `VerifyControl` and the reports screen.

**Expect:** both buttons announce their outcome ("Confirm this report", "Dispute this report"), the selected one announces its selected state, and the tally is announced as one sentence. Set **Larger Text** as in S3-1-K and confirm the two buttons plus the tally reflow rather than clip. Then measure both buttons and the tally row in Accessibility Inspector as in S3-1-L (≥ 44 pt on the smaller dimension).

### S3-3-G — focus ring in all four combinations

**Do:** In the simulator's Settings → Accessibility → Keyboards → **Full Keyboard Access** on; in Simulator choose I/O → Keyboard → **Connect Hardware Keyboard**. Tab to **Confirmed** and to **Disputed** in the unselected state, then vote and repeat in the selected state; do the whole thing again under `xcrun simctl ui booted appearance dark`.

**Expect:** a visible 2 px ring in all four cases, and it changes colour with the state — `colors.focus` when unselected, `colors.onPrimary` when selected. Neither clears 3:1 on the other's background, so the ring has to follow the state. Screenshot each of the four.

### S3-3-H — rapid double tap

**Do:** With VoiceOver on, tap **Confirmed** and then **Disputed** fast enough that both attempts are on the wire at once. Repeat a few times.

**Expect:** the tally ends on the _last_ tap, and exactly one announcement is heard. The screen drops any attempt that a newer one has overtaken, so a late failure can never be pasted over a tally that is now correct, and a stale success can never announce over a live error. Record any double announcement, or any tally that ends on the wrong verdict.

### S3-3-I — signed-out reports screen

**Do:** Settings → **Sign Out** → **Open debug screen** → **View all places →** → P1 → **2 reports** badge.

**Expect:** the heading "Sign in to verify a report"; the body "Confirming or disputing a report is tied to your account, so people know who agreed with what."; a **Sign in** button. A dead end here is the defect the item guards against.

## 7. Supplementary checks

Short, explicitly non-blocking, so the tester can extend the run if time allows.

- `xcrun simctl ui booted appearance dark` on the reports screen with P2, to see the seeded report's card and chips in dark mode.
- VoiceOver rotor navigation on the reports screen — confirm each attribute chip is a single node reading, for the seeded report, "Braille Signage: Partial. Note: Braille in elevators only", not a label node followed by a separate note node.
- Re-running `bun run seed` and confirming it reports 155 skipped, proving the seed is idempotent and that re-seeding does not disturb reports a tester just filed.

## 8. The one case with no UI path: re-reporting after 24 hours

`submitReport` has no injectable clock — a client-settable `now` would be a bypass of the 24-hour abuse guard — and the guard keys on the server-written `updatedAt`, which no client argument can move. So "a second report is accepted once 24 h have passed" has no screen. Exercise it in the dashboard instead.

1. Dashboard → **Data** → `reports` → open the row A just created and set `updatedAt` to a timestamp 25 hours in the past. Save.
2. In the app, sign in as A, open that place, tap **Add or correct this report**, walk 1→4 and submit.
3. **Expect** success: back on the place detail with the count badge now `2 reports`, not the duplicate banner.

Record the exact `updatedAt` you wrote, so the run is reproducible.

## 9. Recording the result

| Story        | Steps run | Passed | Failed | Partial | Not applicable | Tester | Date |
| ------------ | --------- | ------ | ------ | ------- | -------------- | ------ | ---- |
| S3-1 (US-08) |           |        |        |         |                |        |      |
| S3-3 (US-10) |           |        |        |         |                |        |      |

Guidance: quote the literal screen text for every failure, and attach the four focus-ring screenshots from S3-3-G.

**What this run does not cover.** It does not cover the Android hardware-back handler (S3-1-I is not testable on iOS by construction), and it does not cover a live cross-device push on a second client (S3-3-B proves server-side persistence by re-reading as a different user, not a no-refresh update on another device). It also does not re-verify what the automated suites already cover: the draft reducer and the error classification (`report-draft.ts`, `report-errors.ts`, `verification-tally.ts`, `verification-errors.ts`), the report and verification mutations including the self-verification rejection and the 24-hour duplicate guard, and the env-var helpers. Those pass locally under `turbo run test --force` — note that CI runs no test job at all (see "Known gaps" in `docs/traceability.md`), so a green CI badge is not evidence for any of them. The twenty-one boxes in `docs/traceability.md` are the gap this runbook closes.
