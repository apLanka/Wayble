# S4-1 Overview

## S4-1: User Testing Round 1 — Hi-Fi Prototype

**Task:** [https://app.clickup.com/t/z8v0kmrg29](https://app.clickup.com/t/z8v0kmrg29)
**Assignee:** Nishara Senadheera
**Due:** 02 Oct 2026 | **Priority:** Urgent | **Estimate:** 5h

### Goal

Moderated usability testing on hi-fi prototype. Produces baseline pain-points table for report and for S4-2 (on-device Round 2) to compare against.

### Subtasks

1. Recruit 5–6 mock participants (≥1 screen-reader user, ≥1 mobility-aid user) — same disability advocacy contact as stakeholder identified in the previously
2. Prepare moderated task scripts → see **Task Scripts** page
3. Run moderated think-aloud sessions → see **Session Notes** page
4. Log prioritised pain points → see **Pain Points Log** page
5. Write Round 1 summary → see **Round 1 Summary** page

### Pages in this doc

- Task Scripts
- Session Notes
- Pain Points Log
- Round 1 Summary

# Task Scripts

## Moderator Script

**Intro (read to participant):** "Thanks for helping test Wayble. I'll give you 3 tasks. Think out loud as you go — there are no wrong answers, we're testing the app, not you. This session is being recorded for internal review only."

---

### Task 1 — Find a nearby accessible WC

**Prompt:** "You need an accessible bathroom nearby. Find one using the app."

**Expected flow:**
Home tab → "Browse by need" → tap **"Accessible Bathroom"** pill (🚻) → Map tab (filtered) → tap a pin/list item → DetailSheet appears → tap **"View Details →"** → Place Detail screen shows "Accessible Restroom" under Mobility in Verified Features.

_Alt path:_ Home → search bar ("Search accessible places") → type query → tap result → DetailSheet → "View Details →"

**Success criteria:** Participant reaches Place Detail screen and correctly identifies whether restroom is marked accessible.
**Notes:** Watch for confusion between "Browse by need" pills vs. the map's own CategoryFilter bar (duplicate entry points).

---

### Task 2 — Check if a place has a ramp

**Prompt:** "Check if this place has a ramp or step-free entrance."

**Expected flow:**
Home → Map (or tap a place) → DetailSheet → "View Details →" → Place Detail → scroll to **Verified Features → Mobility group** → find **"Step-free Entrance"** row (Available / Not available).

_Alt path:_ Home → "Browse by need" → **"Wheelchair Accessible"** pill → Map filtered → tap place → DetailSheet → "View Details →" → check "Step-free Entrance".

**Success criteria:** Participant locates "Step-free Entrance" attribute and states its value.
**Notes:** App has no literal "ramp" label — closest term is "Step-free Entrance". Watch if participant searches for the word "ramp" and gets stuck (potential terminology mismatch finding — flag as pain point if it occurs).

---

### Task 3 — Submit a report (flag an inaccurate/abusive entry)

**Prompt:** "You've found a report on this place that looks inaccurate. Flag it."

**Expected flow:**
Place Detail → tap report-count badge (e.g. "3 reports") → Reports screen → find the report card → tap kebab **"⋮"** menu (a11y label "Report options") → bottom sheet **"Report this report as…"** → choose a reason (Inaccurate / Spam / Abusive / Privacy concern / Duplicate / Other) → confirm modal **"Flag this report as {Reason}?"** → tap **Flag** → closes, screen-reader announces **"Report flagged."**

**Success criteria:** Participant completes flag flow and understands it succeeded (note: no visible success banner, only VoiceOver/TalkBack announcement — sighted participants may be uncertain it worked. Flag as potential pain point).
**Notes:** Can't flag your own report — kebab menu disabled (dimmed) on own reports. If test report belongs to participant's test account, swap accounts first.

---

### Post-task

- SUS questionnaire (10 items, 1–5 scale)
- Debrief: "What was confusing? What would you change?" — specifically probe: did "ramp" vs "Step-free Entrance" cause hesitation? Was flag success clear without a visible confirmation banner?

# Session Notes

## Participants

| #   | Type               | T1 time | T1 pass? | T2 time | T2 pass? | T3 time | T3 pass? | SUS score | Notes |
| --- | ------------------ | ------- | -------- | ------- | -------- | ------- | -------- | --------- | ----- |
| 1   | Screen-reader user |         |          |         |          |         |          |           |       |
| 2   | Mobility-aid user  |         |          |         |          |         |          |           |       |
| 3   |                    |         |          |         |          |         |          |           |       |
| 4   |                    |         |          |         |          |         |          |           |       |
| 5   |                    |         |          |         |          |         |          |           |       |
| 6   |                    |         |          |         |          |         |          |           |       |

## Observations (freeform, per session)

**How to use:** copy the block for each participant, tick what you actually saw, and fill the blanks in the moment. The prompts come from the expert walkthrough (see below). They are things to **watch for, not results**. Leave anything you did not observe unticked. Record quotes verbatim.

### Per-session template (P1–P6)

**Participant:** P\_ · **Type:** \_\_\_\_ · **Date/time:** \_\_\_\_ · **Device / OS:** \_\_\_\_ · **Assistive tech used:** \_\_\_\_ · **Signed in or guest at start:** \_\_\_\_

**T1 — Find a nearby accessible WC** (start time \_\_ · end time \_\_ · result: Pass / Partial / Fail)

- [ ] Went via "Browse by need"
- [ ] Went via search bar
- [ ] Found the "Accessible Bathroom" pill without help (pill row is clipped on the right) — did they swipe the row? \_\_\_\_
- [ ] Noticed which filter chip was active on Map (selected chip can be off-screen) \_\_\_\_
- [ ] Hit an empty list or map (location off / default location) — what did they do? \_\_\_\_
- [ ] Tapped list item vs map pin (list item skips the bottom sheet) \_\_\_\_
- [ ] On Place Detail, said whether the restroom is accessible: Yes / No / Unsure — based on: "Bathroom" chip / a verified row / other \_\_\_\_
- [ ] Looked for a restroom row under Verified Features and did not find one

* Hesitations, wrong turns, errors: \_\_\_\_
* Quotes: "\_\_\_\_"

**T2 — Check if a place has a ramp / step-free entrance** (start \_\_ · end \_\_ · result: Pass / Partial / Fail)

- [ ] Used the word "ramp" in search — what happened? \_\_\_\_
- [ ] Reached Place Detail → Verified Features → Mobility
- [ ] Found "Step-free Entrance" and stated its value correctly (Available / Not available)
- [ ] Hesitated over "Step-free Entrance" vs "ramp" wording
- [ ] Read or noticed the "not listed ≠ unavailable" note
- [ ] Confused by "Unverified" badge next to the "Verified Features" heading

* Hesitations, wrong turns, errors: \_\_\_\_
* Quotes: "\_\_\_\_"

**T3 — Flag an inaccurate/abusive report** (start \_\_ · end \_\_ · result: Pass / Partial / Fail)

- [ ] Found the report-count badge (e.g. "2 reports") and opened Reports
- [ ] Guest only: reaction to "Sign in to verify a report" \_\_\_\_
- [ ] Found the kebab "⋮" menu on the report card
- [ ] Understood "Report this report as…" and picked a reason: \_\_\_\_
- [ ] Understood the confirm dialog "Flag this report as …?" and tapped Flag
- [ ] Knew whether the flag succeeded — what told them? (visible message / screen-reader announcement / nothing) \_\_\_\_
- [ ] Saw any "Flagged" state on the card afterwards
- [ ] Tried to flag their own report (kebab dimmed) — reaction \_\_\_\_

* Hesitations, wrong turns, errors: \_\_\_\_
* Quotes: "\_\_\_\_"

**Post-task**

- SUS (10 items, 1–5): \_\_\_\_ → score \_\_ / 100
- "What was confusing?" \_\_\_\_
- "What would you change?" \_\_\_\_
- Probe: did "ramp" vs "Step-free Entrance" cause hesitation? \_\_\_\_
- Probe: was flag success clear without a visible banner? \_\_\_\_
- Moderator notes / severity candidates for the Pain Points Log: \_\_\_\_

### P1 — Screen-reader user _(add to the template above)_

- [ ] VoiceOver/TalkBack on, and which? \_\_\_\_
- [ ] Order of focus on Home (pills, search, quick actions) logical? \_\_\_\_
- [ ] Clipped pills reachable and announced with a clear label? \_\_\_\_
- [ ] Chips in Accessibility Profile announced meaningfully? \_\_\_\_
- [ ] "Available / Not available" status announced with the feature name? \_\_\_\_
- [ ] Kebab announced as "Report options"? Reason list and confirm dialog navigable? \_\_\_\_
- [ ] Heard "Report flagged." after confirming? \_\_\_\_
- [ ] Map: could they use List View instead? \_\_\_\_

### P2 — Mobility-aid user _(add to the template above)_

- [ ] Phone held one-handed / on a mount / other \_\_\_\_
- [ ] Reached the bottom tab bar, kebab menu, and the top-right controls comfortably? \_\_\_\_
- [ ] Missed any small tap targets (kebab, List View toggle, chip bar)? \_\_\_\_
- [ ] Which place info mattered most to them (step-free entrance, wide entrance, interior, elevator, parking)? \_\_\_\_
- [ ] Did "Available / Not available" give enough confidence to plan a visit? \_\_\_\_

### P3 · P4 · P5 · P6

Copy the per-session template above. Record the participant type in the Participants table.

- P1: _(session log)_
- P2: _(session log)_
- P3: _(session log)_
- P4: _(session log)_
- P5: _(session log)_
- P6: _(session log)_

## Expert walkthrough (Claude, iPhone 17 Pro simulator) — 1 Oct 2026

Not a human participant. Not counted in N or the SUS average. Times were not measured.

| Task                  | Result             | What happened                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 Find accessible WC | Fail (partial)     | Home → swipe pills to find "Accessible Bathroom" → Map (selected chip hidden, list empty until Colombo location was set) → list item → Place Detail. A "Bathroom" chip appears in Accessibility Profile, but no restroom row in Verified Features (Mansa Fitness and Avanya Restaurant). Could not confirm the restroom is accessible.   |
| T2 Check ramp         | Pass               | Mansa Fitness → Verified Features → Mobility → "Step-free Entrance: Not available" found in one scroll. Searching "ramp" on Home returned nothing and no message.                                                                                                                                                                        |
| T3 Flag a report      | Pass with friction | Avanya Restaurant → "2 reports" → kebab on "Debug Voter" card → "Report this report as…" → Inaccurate → "Flag this report as Inaccurate?" → Flag. Server answered "You already flagged this report." (this account had flagged it earlier), so success feedback is untested. Guest sees "Sign in to verify a report" instead of reports. |

Setup notes: simulator GPS set to Colombo (6.9271, 79.8612) because the app defaults to Bangalore. Signed in as an existing test account. Pre-existing flag on that report left unchanged.

(Participant rows above are left blank for the real moderated sessions.)

# Pain Points Log

> **Source:** Expert walkthrough by Claude (AI) on iPhone 17 Pro simulator (iOS 26.5), native build via `expo run:ios`, 1 Oct 2026. Frequency = "W" means observed in the walkthrough (n=1). Human-participant frequencies to be added after moderated sessions.

| #   | Pain point                                                                                                                                                                                                                                                                                                                                                                              | Task   | Frequency (# participants) | Severity (Low/Med/High) | Notes / fix candidate                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Place Detail "Accessibility Profile" shows chips (Bathroom, Elevator, Wheelchair) but Verified Features has no matching row. User cannot tell if the restroom is actually accessible. Seen on Mansa Fitness (Bathroom chip, no restroom row) and Avanya Restaurant (Bathroom + Elevator chips, only Mobility/Vision rows). Script expected an "Accessible Restroom" row under Mobility. | T1     | W (1)                      | High                    | Add a Restroom row to Verified Features, or label chips as "reported" vs "verified".                         |
| 2   | Home "Browse by need" pills are clipped. "Accessible Bathroom" is off-screen with no scroll affordance. The pill I tapped then opened Map with "All Places" visible and the Bathroom chip selected off-screen, so the active filter was hidden.                                                                                                                                         | T1     | W (1)                      | High                    | Wrap or fade-edge the pills. Scroll the Map chip bar to the selected chip on open.                           |
| 3   | With no location permission the map defaults to Bangalore (app data is Colombo). List View shows "No places found nearby." with no recovery action. Map tiles were blank on first load.                                                                                                                                                                                                 | T1     | W (1)                      | Med                     | Default to Colombo or the last-known place. Empty state should offer "Enable location" and "Search instead". |
| 4   | Guests are blocked from the Reports screen entirely: "Sign in to verify a report", shown even when the goal is to read or flag.                                                                                                                                                                                                                                                         | T3     | W (1)                      | Med                     | Let guests read reports. Gate only the actions and say which action needs sign-in.                           |
| 5   | Flag flow gives no state on the card. Duplicate flag is only discovered after Reason, then Confirm: "You already flagged this report." The confirm dialog does not name which report (2 cards on screen).                                                                                                                                                                               | T3     | W (1)                      | Med                     | Show a "Flagged" state on the card and disable the menu item. Name the report in the confirm dialog.         |
| 6   | Contradictory trust signals: "Unverified" badge above a "Verified Features" heading. Cargills shows a "Wheelchair" profile chip with "0 reports / No accessibility features reported".                                                                                                                                                                                                  | T1, T2 | W (1)                      | Med                     | Rename the heading to "Reported features". Hide profile chips when there are no reports.                     |
| 7   | "ramp" is not searchable. Typing it on Home jumps to Map with no results, no suggestion and no empty-state message. The "Step-free Entrance" label is only discoverable by browsing.                                                                                                                                                                                                    | T2     | W (1)                      | Med                     | Add synonyms (ramp, step-free, wheelchair entrance). Show "No results for 'ramp'".                           |
| 8   | Flag success feedback not verified. The test account had already flagged the report, so the success announcement or banner was not exercised. Script predicts no visible banner.                                                                                                                                                                                                        | T3     | W (1), untested            | Med                     | Re-test on a fresh report. Add a visible toast and keep the VoiceOver announcement.                          |
| 9   | Report menu wording is awkward and unexplained: sheet title "Report this report as…", no reason descriptions, no visible Cancel on the sheet.                                                                                                                                                                                                                                           | T3     | W (1)                      | Low                     | Retitle "Why are you flagging this?". Add one-line reason help.                                              |
| 10  | Kebab "⋮" on own report is dimmed with no explanation. The Confirm/Dispute buttons do explain ("You can't verify your own report").                                                                                                                                                                                                                                                     | T3     | W (1)                      | Low                     | Add the same helper text, or hide the kebab on own reports.                                                  |
| 11  | Inconsistent labels and raw values: list shows "Food\_And\_Drink", detail shows "food and drink" and "healthcare"; the same filter is "Accessible Bathroom" on Home and "Bathroom" on Map.                                                                                                                                                                                              | T1     | W (1)                      | Low                     | Single label map used by every screen.                                                                       |
| 12  | Seed or debug text visible to users ("Debug seed report", stray ". Note:" punctuation).                                                                                                                                                                                                                                                                                                 | T2     | W (1)                      | Low                     | Seed-data cleanup before testing with real participants.                                                     |
| 13  | Branding gaps: iOS permission prompt says "mobile" instead of Wayble, and the welcome-screen logo tile is blank white.                                                                                                                                                                                                                                                                  | T1     | W (1)                      | Low                     | Set app display name and fix the logo asset.                                                                 |
| 14  | "Not listed ≠ unavailable" disclaimer is small and below the fold.                                                                                                                                                                                                                                                                                                                      | T2     | W (1)                      | Low                     | Move up, or show "Not assessed" inline.                                                                      |
| 15  | Flow differs from the script: tapping a list item opens Place Detail directly (no DetailSheet). Dev-build red error toast overlays the tab bar after a failed mutation (dev only).                                                                                                                                                                                                      | T1, T3 | W (1)                      | Low                     | Update the script. Ignore the toast for the production build.                                                |

Sorted by severity × frequency (all W=1, so by severity).

# Round 1 Summary

## Round 1 Summary — Hi-Fi Prototype User Testing

**Participants:** N=\_\_ human participants (incl. ≥1 screen-reader user, ≥1 mobility-aid user) — **pending moderated sessions**.
**Interim evidence:** expert walkthrough of all 3 tasks by Claude on the native iOS build (iPhone 17 Pro simulator, 1 Oct 2026). See Session Notes and Pain Points Log.
**Method:** Moderated think-aloud, 3 tasks, SUS post-test (walkthrough: task execution only, no SUS).

### Overall SUS score

Average: \_\_ / 100 (pending human sessions)

### Task completion

| Task                    | Avg time                      | Completion rate                                                                    |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| T1 — Find accessible WC | \_\_ (walkthrough: not timed) | Human: \_\_ · Walkthrough: Fail (partial) — restroom accessibility not confirmable |
| T2 — Check ramp         | \_\_ (walkthrough: not timed) | Human: \_\_ · Walkthrough: Pass                                                    |
| T3 — Submit report      | \_\_ (walkthrough: not timed) | Human: \_\_ · Walkthrough: Pass with friction (success feedback untested)          |

### Before / After Pain-Points Table

| Pain point                                                                                           | Severity | Status     | Fix (if applied this sprint) |
| ---------------------------------------------------------------------------------------------------- | -------- | ---------- | ---------------------------- |
| Accessibility Profile chips (Bathroom/Elevator) with no matching Verified Features row               | High     | Open       | —                            |
| Browse-by-need pills clipped; selected filter chip hidden off-screen on Map                          | High     | Open       | —                            |
| Default location Bangalore, empty state has no recovery                                              | Med      | Open       | —                            |
| Guests blocked from reading reports                                                                  | Med      | Open       | —                            |
| Flag flow: no on-card state, duplicate flag found only after confirm, dialog doesn't name the report | Med      | Open       | —                            |
| "Unverified" badge vs "Verified Features" heading; chip with 0 reports                               | Med      | Open       | —                            |
| "ramp" search returns nothing and no message                                                         | Med      | Open       | —                            |
| Flag success feedback untested                                                                       | Med      | To re-test | —                            |
| Minor: wording, labels, seed/debug text, branding, disclaimer placement (items 9–15)                 | Low      | Open       | —                            |

### Key takeaways

- Biggest T1 risk is trust: the app shows a Bathroom chip but no verifiable restroom row, so users cannot answer "is it accessible?".
- Filter hand-off from Home to Map hides the active filter; fix before Round 2.
- T3 works end to end, but feedback and state are weak: no on-card flagged state, success feedback not yet verified.
- Default location and empty states fail silently outside seeded areas.
- Walkthrough findings are heuristics from one evaluator; confirm and re-rank with real participants, especially screen-reader users (VoiceOver was not exercised in this walkthrough).

### Baseline for S4-2

This summary is the Round 1 baseline. S4-2 (on-device Round 2) compares against these SUS scores, completion times, and pain points. Fill the human-participant columns after sessions, then re-sort the Pain Points Log.
