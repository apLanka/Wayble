# S4-2: User Testing Round 2 — On-Device App (SE3050 M4)

**Task:** [https://app.clickup.com/t/z8v0kmrg2a](https://app.clickup.com/t/z8v0kmrg2a)
**Assignee:** Pasindu Janith · **Priority:** Urgent · **Estimate:** 5h
**Baseline:** [S4-1 Round 1 — Hi-Fi Prototype](S4-1-user-testing-round-1.md)
**Build under test:** `main` at `c7baa58` (includes US-23 live feed and the S4-5 strings module). US-09 photo evidence and US-16 needs ranking are not on `main` yet, so they are out of scope for this round.

### Goal

Run T1–T3 again on the built app, plus T4 (confirm someone else's report) and T5 (read the live feed). Record task time on the device, compare against Round 1, note regressions and new issues from Sprint 3, and produce the before/after table for the SE3050 report.

### Subtasks

1. Run T1–T3 + T4 + T5 on the built app → **Moderator Script**, **Session Notes**
2. Record on-device task timing and compare against the Round 1 baseline → **Timing Sheet**, **Round 2 Summary**
3. Note regressions or new issues introduced in Sprint 3 → **Regressions and New Issues**
4. Write the Round 2 summary and before/after comparison table → **Round 2 Summary**

### What the Round 1 baseline actually contains

Read this before comparing anything.

| Round 1 metric                | Recorded?                                                      | Consequence for Round 2                                                                |
| ----------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Human participants (N, types) | No. Participant table is blank ("pending moderated sessions"). | No human baseline to compare against yet.                                              |
| Task times                    | No. The walkthrough was not timed.                             | Round 2 times are recorded fresh. Time comparison needs human sessions in both rounds. |
| Completion per task           | Walkthrough only (n=1, not a participant)                      | Compare walkthrough to walkthrough.                                                    |
| SUS                           | No                                                             | Round 2 SUS stands alone until Round 1 sessions are run.                               |
| Pain points                   | 15, from the walkthrough (W=1)                                 | Each is re-checked below. This is the comparison we can make now.                      |

**Rule for this doc:** human-participant cells are filled only from real sessions. Walkthrough results are labelled as walkthrough and never counted in N or the SUS average.

---

# Moderator Script

**Intro (read to participant):** "Thanks for helping test Wayble. I'll give you 5 tasks on this phone. Think out loud as you go. There are no wrong answers, we're testing the app, not you. This session is recorded for internal review only."

**Setup before each session**

- Build: `main` at `c7baa58`, native dev build (`expo run:ios` / `expo run:android`). Mapbox needs a native build, so Expo Go will not work.
- Device location: Colombo (simulator: 6.9271, 79.8612). Seed data is in Colombo.
- Location permission: granted (T1 records separately if a participant denies it).
- Account: signed in as a test participant account that has **not** written or flagged the reports used in T3/T4. Reset flags between sessions, or use a fresh report, so the T3 success feedback is actually exercised (Round 1 pain point #8).
- Screen reader: on for screen-reader participants (note VoiceOver or TalkBack).
- Timer: start when the prompt is finished being read, stop when the success criterion is met or the participant gives up. Max 5 min per task; at 5 min record Fail.

---

### Task 1 — Find a nearby accessible WC

**Prompt:** "You need an accessible bathroom nearby. Find one using the app."

**Expected flow (current app):**
Home → "Browse by need" → swipe the pill row → tap **"Accessible Bathroom"** → Map opens with the Bathroom filter → tap a pin (opens DetailSheet → "View Details →") **or** switch to List View and tap a row (opens Place Detail directly) → Place Detail → look for an **"Accessible Restroom"** row under Verified Features.

_Alt path:_ Map → search bar → type a place name → tap result.

**Success criterion:** Participant reaches a Place Detail screen and correctly says whether the restroom is accessible, based on a Verified Features row.

**Watch for:** clipped pill row (R1 #2), hidden selected chip on Map (R1 #2), Bathroom chip with no restroom row (R1 #1), empty list without location (R1 #3), raw labels such as "Food_And_Drink" (R1 #11).

---

### Task 2 — Check if a place has a ramp

**Prompt:** "Check if this place has a ramp or step-free entrance." (Hand over the phone on a named place, e.g. Mansa Fitness, or name it.)

**Expected flow:**
Place Detail → Verified Features → Mobility → **"Step-free Entrance"** row → read Available / Not available.

**Success criterion:** Participant finds "Step-free Entrance" and states its value.

**Watch for:** searching the word "ramp" (no synonyms, no "No results" message, R1 #7), "not listed ≠ unavailable" note below the fold (R1 #14).

---

### Task 3 — Flag an inaccurate report

**Prompt:** "You've found a report on this place that looks inaccurate. Flag it."

**Expected flow:**
Place Detail → tap the **"N reports"** badge → Reports → kebab **"⋮"** on another person's report ("Report options") → sheet **"Report this report as…"** → choose a reason → confirm **"Flag this report as {Reason}?"** → **Flag** → screen reader announces "Report flagged."

**Success criterion:** Participant completes the flag and can say whether it worked.

**Watch for:** what tells them it worked (there is no visible toast, R1 #8), no "Flagged" state on the card (R1 #5), no visible Cancel on the reason sheet (R1 #9), dimmed kebab on own report (R1 #10).

---

### Task 4 — Confirm someone else's report (new in Round 2)

**Prompt:** "Someone reported this place's accessibility. You've been there and they're right. Let the app know."

**Expected flow:**
Place Detail → **"N reports"** badge → Reports → on another person's card, tap **"Confirmed"** → button fills, tally updates, screen reader announces "Report confirmed."

**Success criterion:** Participant records a confirm vote on a report that is not theirs and can say it was recorded.

**Watch for:** buttons read "Confirmed" / "Disputed" before any vote (candidate new issue N1), whether a guest understands the sign-in wall (R1 #4), whether they try to confirm their own report.

---

### Task 5 — Read the live feed (new in Round 2)

**Prompt:** "Find out what other people have been verifying near you recently. What was the most recent one?"

**Expected flow:**
Home → **"Activity"** button → **"Nearby activity"** → read the top row ("{who} confirmed/disputed {attribute} at {place}. {when}. {confidence}.").

**Success criterion:** Participant opens the feed and correctly reads out who, what, where and when for the top item.

**Watch for:** finding the entry point (it is a Home button, not a tab, candidate new issue N2), the empty state if there are no nearby verifications (seed a confirm before the session), live updates if the moderator confirms a report on a second device during the task, whether screen-reader users hear new rows announced.

---

### Post-task

- SUS questionnaire (10 items, 1–5). Scoring below.
- Debrief: "What was confusing? What would you change?"
- Probes: Was it clear the flag worked? Did "Confirmed" read as an action or a status? Would you expect the activity feed to be a tab?
- Returning participants (PRD target ≥3): "What feels different from the prototype?"

---

# Timing Sheet

Times in seconds. Result: P = pass, PA = partial (needed a hint or gave a wrong answer then corrected), F = fail or gave up. Errors = wrong turns (backing out of a screen, wrong tab, wrong control).

| #   | Type               | Returning? | T1 s | T1  | T1 err | T2 s | T2  | T2 err | T3 s | T3  | T3 err | T4 s | T4  | T4 err | T5 s | T5  | T5 err | SUS |
| --- | ------------------ | ---------- | ---- | --- | ------ | ---- | --- | ------ | ---- | --- | ------ | ---- | --- | ------ | ---- | --- | ------ | --- |
| 1   | Screen-reader user |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |
| 2   | Mobility-aid user  |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |
| 3   |                    |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |
| 4   |                    |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |
| 5   |                    |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |
| 6   |                    |            |      |     |        |      |     |        |      |     |        |      |     |        |      |     |        |     |

**SUS scoring:** for odd items (1, 3, 5, 7, 9) take score − 1; for even items (2, 4, 6, 8, 10) take 5 − score. Sum the ten values and multiply by 2.5 to get 0–100. 68 is the usual average.

# Session Notes

### Per-session template (P1–P6)

**Participant:** P\_ · **Type:** \_\_\_\_ · **Returning from Round 1?** \_\_ · **Date/time:** \_\_\_\_ · **Device / OS:** \_\_\_\_ · **Assistive tech:** \_\_\_\_ · **Signed in or guest at start:** \_\_\_\_

**T1** (start \_\_ · end \_\_ · P / PA / F)

- [ ] Went via "Browse by need" / search / Map directly
- [ ] Swiped the pill row to find "Accessible Bathroom"
- [ ] Noticed which chip was active on Map
- [ ] Hit an empty list (location) — what did they do? \_\_\_\_
- [ ] Pin + DetailSheet or List row
- [ ] Answered restroom question: Yes / No / Unsure — based on: chip / Verified Features row / other \_\_\_\_

* Hesitations, wrong turns: \_\_\_\_
* Quotes: "\_\_\_\_"

**T2** (start \_\_ · end \_\_ · P / PA / F)

- [ ] Searched "ramp" — what happened? \_\_\_\_
- [ ] Found "Step-free Entrance" and read its value correctly
- [ ] Noticed the "not listed ≠ unavailable" note

* Hesitations, wrong turns: \_\_\_\_
* Quotes: "\_\_\_\_"

**T3** (start \_\_ · end \_\_ · P / PA / F)

- [ ] Found the "N reports" badge
- [ ] Found the kebab "⋮" on the card
- [ ] Picked a reason: \_\_\_\_
- [ ] Knew it worked — what told them? (announcement / nothing / other) \_\_\_\_
- [ ] Looked for a "Flagged" state on the card

* Hesitations, wrong turns: \_\_\_\_
* Quotes: "\_\_\_\_"

**T4** (start \_\_ · end \_\_ · P / PA / F)

- [ ] Found Confirm on someone else's card
- [ ] Read "Confirmed" as a button / as a status already set
- [ ] Noticed the tally change or heard "Report confirmed."

* Hesitations, wrong turns: \_\_\_\_
* Quotes: "\_\_\_\_"

**T5** (start \_\_ · end \_\_ · P / PA / F)

- [ ] Found the "Activity" button on Home (or looked in the tabs first)
- [ ] Read who / what / where / when for the top row correctly
- [ ] Noticed a live update (if triggered)
- [ ] Screen reader: new row announced? \_\_\_\_

* Hesitations, wrong turns: \_\_\_\_
* Quotes: "\_\_\_\_"

**Post-task:** SUS raw answers \_\_\_\_ → \_\_ / 100 · Confusing: \_\_\_\_ · Would change: \_\_\_\_ · Probes: \_\_\_\_

**Screen-reader add-on (P1):** focus order on Home · pills announced · kebab announced as "Report options" · "Report flagged." heard · Confirmed/Disputed state announced · feed rows read in full · used List View instead of Map?

**Mobility-aid add-on (P2):** grip (one hand / mount) · reached kebab, chip bar, Activity button, Confirm/Dispute comfortably · missed any targets?

- P1: _(session log)_
- P2: _(session log)_
- P3: _(session log)_
- P4: _(session log)_
- P5: _(session log)_
- P6: _(session log)_

---

# Round 1 Pain Points — Re-check

Status from a code review of `main` at `c7baa58` on 8 Oct 2026, before any Round 2 session. "R2 observed" is filled from sessions.

| R1 # | Pain point                                                                        | R1 sev | Status on `main` (code)  | Evidence                                                                                                                                                                                       | R2 observed (# participants) |
| ---- | --------------------------------------------------------------------------------- | ------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1    | Bathroom chip, no restroom row in Verified Features                               | High   | Open                     | Chips come from `places.accessibilityCategories`; Verified Features only shows attributes from active reports. `mobility.accessible_restroom` exists but appears only if a report includes it. |                              |
| 2    | Pill row clipped; selected Map chip hidden                                        | High   | Open                     | `CategoryShortcuts` hides the scroll indicator, no fade; `CategoryFilter` never scrolls to the selected chip.                                                                                  |                              |
| 3    | No location → empty list, no recovery                                             | Med    | Partly fixed             | Banner above the list now has Enable / Open Settings. Empty state is still plain text; no "Search instead". No default location, so the map opens at the Mapbox default.                       |                              |
| 4    | Guests can't read reports                                                         | Med    | Open                     | Reports screen returns only the sign-in wall for guests.                                                                                                                                       |                              |
| 5    | No "Flagged" state; duplicate found after confirm; dialog doesn't name the report | Med    | Open                     | `listForPlace` returns no flag state; duplicate check runs on Flag tap; title names the reason only.                                                                                           |                              |
| 6    | "Unverified" badge vs "Verified Features"; chips with 0 reports                   | Med    | Partly fixed             | Confidence badge moved under the category line. Profile chips still show with 0 reports.                                                                                                       |                              |
| 7    | "ramp" search returns nothing, no message                                         | Med    | Open                     | Search matches place name only; dropdown hidden when empty.                                                                                                                                    |                              |
| 8    | Flag success feedback untested                                                    | Med    | To re-test               | Only `announceForAccessibility("Report flagged.")`; no visible toast. Sighted participants get no feedback.                                                                                    |                              |
| 9    | "Report this report as…", no reason help, no Cancel                               | Low    | Open                     | Same title; bare reason labels; sheet closes only on backdrop tap.                                                                                                                             |                              |
| 10   | Dimmed kebab on own report, no reason                                             | Low    | Open                     | `disabled` at 50% opacity, no hint. Confirm/Dispute does explain.                                                                                                                              |                              |
| 11   | Raw / inconsistent category labels                                                | Low    | Open                     | List shows raw category capitalised; detail replaces `_` only; Map chip shows "bathroom" while Home says "Accessible Bathroom".                                                                |                              |
| 12   | Debug/seed text visible                                                           | Low    | Open (partly unknown)    | "Debug seed report" still created by the Developer card's debug action. Stray ". Note:" not found in visible UI; check stored note text on device.                                             |                              |
| 13   | iOS prompt says "mobile"; blank logo                                              | Low    | Name open; logo to check | `app.json` name is still "mobile". Logo is wired to a real asset; check on device.                                                                                                             |                              |
| 14   | "Not listed ≠ unavailable" note small, below the fold                             | Low    | Open                     | Still the last element, 12 pt.                                                                                                                                                                 |                              |
| 15   | List row skips DetailSheet                                                        | Low    | By design                | Script updated to match.                                                                                                                                                                       |                              |

**Summary:** 0 of 15 fixed, 2 partly fixed, 1 by design, 12 open or to re-test. Sprint 3 did not target these items.

# Regressions and New Issues (Sprint 3)

Candidates from the code review. Confirm or reject each in sessions before it goes in the report.

| #   | Issue                                                                                                                                    | Area  | Task | Proposed sev | Confirmed in sessions? |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ------------ | ---------------------- |
| N1  | Confirm/Dispute buttons read "Confirmed" / "Disputed" (past tense) before the user has voted, so they look like a status, not an action. | US-10 | T4   | Med          |                        |
| N2  | Live feed is reachable only from an "Activity" button on Home. Not a tab, not linked from Place Detail.                                  | US-23 | T5   | Med          |                        |
| N3  | Feed needs location. Without it, "Location needed" with an Allow button (good), but no fallback to recent activity.                      | US-23 | T5   | Low          |                        |

No regressions in the T1–T3 flows turned up in the code review. Confirm in sessions.

---

# Round 2 Summary

**Participants:** N=\_\_ (≥1 screen-reader user, ≥1 mobility-aid user, ≥3 returning) — **pending sessions**.
**Method:** Moderated think-aloud on the device, 5 tasks, on-device timing, SUS.
**Build:** `main` at `c7baa58`.

### Overall SUS

| Round               | Average SUS  | N   |
| ------------------- | ------------ | --- |
| Round 1 (prototype) | not recorded | 0   |
| Round 2 (app)       |              |     |

### Task completion and time

| Task                  | R1 completion (walkthrough) | R2 completion (walkthrough) | R2 completion (human) | R2 median time (human) | Change |
| --------------------- | --------------------------- | --------------------------- | --------------------- | ---------------------- | ------ |
| T1 Find accessible WC | Fail (partial)              |                             |                       |                        |        |
| T2 Check ramp         | Pass                        |                             |                       |                        |        |
| T3 Flag a report      | Pass with friction          |                             |                       |                        |        |
| T4 Confirm a report   | not tested                  |                             |                       |                        | new    |
| T5 Read live feed     | not tested                  |                             |                       |                        | new    |

Round 1 has no timings, so "Change" for time is only possible if Round 1 human sessions are run.

### Before / After Pain-Points Table

| Pain point                                                        | R1 sev | R1 status  | R2 status           | Fix                           |
| ----------------------------------------------------------------- | ------ | ---------- | ------------------- | ----------------------------- |
| Bathroom chip with no matching Verified Features row              | High   | Open       | Open                | —                             |
| Pills clipped; selected Map chip hidden                           | High   | Open       | Open                | —                             |
| No location → empty list, no recovery                             | Med    | Open       | Partly fixed        | Enable / Open Settings banner |
| Guests can't read reports                                         | Med    | Open       | Open                | —                             |
| Flag flow: no on-card state, late duplicate check, unnamed report | Med    | Open       | Open                | —                             |
| "Unverified" vs "Verified Features"; chips with 0 reports         | Med    | Open       | Partly fixed        | Badge moved                   |
| "ramp" search, no message                                         | Med    | Open       | Open                | —                             |
| Flag success feedback                                             | Med    | To re-test |                     | —                             |
| Minor: wording, labels, debug text, branding, disclaimer (9–15)   | Low    | Open       | Open (15 by design) | —                             |
| N1 Past-tense Confirm/Dispute labels                              | —      | —          | New                 |                               |
| N2 Feed only reachable from Home button                           | —      | —          | New                 |                               |

### Key takeaways

_(write after sessions)_
