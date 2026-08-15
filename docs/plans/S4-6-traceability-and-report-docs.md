# S4-6: Traceability Matrix & Report Documentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Sprint 3 traceability record, write the two ADRs the repo references but has never had, and produce the retrospective and burndown actuals — from verified evidence, not from the PRD's claims.

**Architecture:** One investigation task establishes a dated fact base, and every later task cites it. Documentation is written to record **status including non-delivery**: a traceability matrix that shows five of seven Sprint 3 stories did not land is more defensible to an SE3080 panel than one that asserts tests and screens which do not exist.

**Tech Stack:** Markdown, git, bun test runners. No code is written by this task except one optional import fix.

**Spec:** ClickUp `z8v0kmrg2e` and its four subtasks, in `docs/sprint_tasks_and_subtasks.md`. Requirement source is `docs/PRD-wayble.md` §9 (matrix format), §6 (EDI), §12 (stack justification). This plan is the spec-of-record for scope and wording.

---

## Global Constraints

1. **No row may assert a function, screen or test that does not exist.** Every cell is verified by a command recorded in the fact base. A row for an undelivered story records that it is undelivered.
2. **Every number states its command and date.** The existing `docs/traceability.md` is the house standard here — it already records that a count drifted 29→30 and 15→14 while the total stayed right. Match it or beat it.
3. **Git history is not a burndown source.** See "What the investigation found" — 44 of 46 commits in the Sprint 3 window share one date. ClickUp card close dates are the only real per-card source.
4. **Never `git add -A` or `git add .`.** `bun.lock` and three untracked docs are the partner's and stay uncommitted. This is Global Constraint 3 from S4-5 and it still holds.
5. **PRD:207's warning is binding.** "Do not write 'multilingual' or 'works offline'… Claiming them and failing a VIVA probe costs more than not claiming them." The same applies to coverage, and this task is where that temptation is strongest.
6. **Stage by explicit path.** Each task names its files.

---

## What the investigation found

Run on 2026-09-29 against `origin/main` = `e6379fc`. These are facts, not assumptions, and they change the task.

### Five of seven Sprint 3 stories are not in `main`

| Story                 | In `main`? | Evidence                                                                                                                     |
| --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| US-08 submit report   | **yes**    | `submitReport`, `listForPlace`; 44 commits on 2026-09-16                                                                     |
| US-10 confirm/dispute | **yes**    | `verifyReport`, `forReport`; 10 commits on 2026-09-27                                                                        |
| US-11 confidence      | **no**     | `computeConfidence` absent from `main`; present on unmerged `origin/feature/s3-4-…(US-11)`, tip 2026-09-28                   |
| US-23 live feed       | **no**     | `recentVerifications` absent from `main` _and_ from `origin/feat/s3-7-…`, whose tip is 2026-08-29 — before the sprint opened |
| US-09 photo evidence  | **no**     | `generateUploadUrl` absent; no branch anywhere matching us-09/photo/upload                                                   |
| US-13 flagging        | **no**     | `flagReport` absent; no branch anywhere matching us-13/flag                                                                  |
| US-16 needs ranking   | **no**     | `matchScore` absent; no branch anywhere matching us-16/ranking                                                               |

The backend exports 46 named symbols from `main`, some of them constants rather
than functions. None of the five missing functions is among them.

### Sprint 3 did **not** revisit either architecture decision

- `schema.ts` gained exactly two lines across the window: the `by_author` and `by_place_and_author` indexes, both required by US-08's own design. That is implementing a story inside the existing entity model, not revisiting it.
- No dependency change. The only package-adjacent commit is `fix(mobile): declare the sf-symbols-typescript import`, a missing type declaration.
- The map stack is unchanged in committed history. (The map removal in the working tree is the partner's uncommitted work and is not evidence of anything.)
- The backend gained functions and lost none; no module was restructured.

So ADR-001 and ADR-002 get written as **"considered in Sprint 3, not revisited"**, with that evidence — which is a stronger artefact than a manufactured revisit, because it is checkable.

### Git cannot produce a burndown

```
$ git log --format='%ad' --date=short | sort | uniq -c
      1 2026-09-07
     46 2026-09-16      <- 44 of these are tagged (us-08)
      1 2026-09-26
     31 2026-09-27
     17 2026-09-28
```

Sprint 3 opened 07 Sep and closed 18 Sep. In that window there are 47 commits: 1 on the 7th, 46 on the 16th. A burndown curve from that is a vertical line. US-10, 10 commits, landed on 27 Sep — **nine days after the sprint closed.**

### The partner's uncommitted `traceability.md` change does not collide

It rewrites the manual verification checklist so each box names its runbook step. It touches no part of the story matrix, the Status table, the number-provenance blocks, or Known gaps — which is where all S4-6 work lands. Unlike the mapbox WIP, it is a strict improvement to a section this task does not need to change.

## Review Focus

The spec is "document what we built". Its silence on the following is not permission to smooth them over.

1. **A row implying code that does not exist.** A panel diffing the matrix against `main` finds it in minutes, and it invalidates every other number in the document. → Task 1, Task 4
2. **A test count quoted from an earlier task's block.** The doc already records one drift where the total was right and the split was not. The mobile total moved 44 → 73 → 116. → Task 3
3. **An ADR written to look thorough rather than to record what happened.** "Considered, not revisited, here is the evidence" is the accurate ADR. Inventing a revisit is the failure. → Task 2
4. **A burndown reconstructed from git.** It would look plausible and be meaningless, because the work was committed in one spike. → Task 5
5. **A retrospective that blames people or hides a real miss.** Five stories did not land and US-10 landed late; a retrospective that omits either is worthless to the team and obvious to a panel. → Task 6

---

## File Structure

**Create:**

- `docs/adr/0001-map-geospatial-fallback.md` — ADR-001
- `docs/adr/0002-convex-and-expo-stack.md` — ADR-002
- `docs/adr/README.md` — index and status, one line per ADR
- `docs/sprint-3-retrospective.md` — subtask `z8v0kmrj5e`
- `docs/sprint-3-burndown.md` — subtask `z8v0kmrj5r`
- `docs/sprint-3-delivery-facts.md` — the fact base, cited by every other task

**Modify:**

- `docs/traceability.md` — the matrix, Status, number provenance, Known gaps, header

**Not modified:** any source file. If a number turns out to be wrong, the plan records it as wrong rather than changing the code to match the doc.

---

## ADR format

The repo has **no existing ADR**, so this task sets the precedent. Both files
follow MADR's shape — the academic default, and it reads well pasted into a
report:

```
# NNNN. <Title>
Status: Accepted — reconsidered in Sprint 3, not revisited. See "Revisited?".
Date: <YYYY-MM-DD, or "not recorded in the repository">

## Context
## Decision
## Consequences
## Revisited?
```

Two notes on sources. `docs/plans/S0-5-entity-model-accessibility-taxonomy.md` is
**not** a decision record to copy the shape of — it is an implementation plan with
a "Decisions to Agree Before Implementation" section. It is useful here for a
different reason: it is where the entity model that ADR-002's consequences depend
on was agreed, so cite it rather than restate it. And the four PRD lines
describing each decision are the only surviving account of what was decided,
because nothing was written down at the time.

---

### Task 1: The fact base

**Files:**

- Create: `docs/sprint-3-delivery-facts.md`

**Interfaces:**

- Consumes: nothing. Every later task cites this file.
- Produces: a dated table of, per Sprint 3 story — implemented in `main` / on an unmerged branch / absent; the Convex functions present; the test files present and their case counts. Plus a test-count block with the three commands and their output. Plus the git commit distribution. This file is the citation target for Tasks 3, 4, 5 and 6.

- [ ] **Step 1: Record the per-story delivery state**

For each of the seven Sprint 3 stories, run and record the output of:

```bash
git show origin/main --stat --oneline | head -1   # baseline ref
grep -rn "submitReport\|verifyReport\|forReport\|computeConfidence\|flagReport\|matchScore\|recentVerifications\|generateUploadUrl" \
  packages/backend/convex --include='*.ts' | grep -v _generated
git branch -r | grep -iE "us-09|us-11|us-13|us-16|us-23|flag|confidence|ranking|feed|photo"
```

Then, for each function the PRD §9 names, record which of three states holds: **present in `main`**, **present only on branch `<name>`**, or **absent everywhere**, with the grep output as the evidence. A row with no grep output is a row with no evidence.

- [ ] **Step 2: Record the test inventory with commands and counts**

```bash
bun run --filter @packages/backend test    # 17 files, 162 cases
bun run --filter mobile test                # 7 files, 116 cases
bun run test                                # 1 file, 18 cases (scripts/, bun:test)
```

Then list each mobile and backend suite by name with its case count, read from the runner output rather than counted by hand:

```bash
bun run --filter mobile test 2>&1 | grep -E "✓ .*\.test\.ts"
```

State the repo-wide total as 162 + 116 + 18 = **296 across three runners**, and name the third runner. The existing doc records 253 and calls the omission of `scripts/` a known gap; that gap is now closed by counting it.

- [ ] **Step 3: Record the git distribution and the commit-date finding**

Record the `uniq -c` output from the investigation, and the conclusion in one sentence: the Sprint 3 window holds 47 commits, 46 of them on 2026-09-16, so git dates cannot express a burndown. Also record that US-10's 10 commits are dated 2026-09-27, outside the sprint.

- [ ] **Step 4: Record the architecture finding**

The `schema.ts` diff across the window, the absence of dependency changes, and the backend function count before and after. One paragraph, with the diff quoted.

- [ ] **Step 5: State what this file is not**

One line: it is a snapshot of `origin/main` at `e6379fc` on 2026-09-29, not a claim about what the team did — people may have written code in branches not pushed. This matters, because four stories have no pushed branch either, and "not in the repository" is a different statement from "not done".

- [ ] **Step 6: Verify and commit**

```bash
bunx prettier --check docs/sprint-3-delivery-facts.md
git add docs/sprint-3-delivery-facts.md
git commit -m "docs(s4-6): record the Sprint 3 delivery fact base"
```

### Task 2: ADR-001 and ADR-002

**Files:**

- Create: `docs/adr/0001-map-geospatial-fallback.md`, `docs/adr/0002-convex-and-expo-stack.md`, `docs/adr/README.md`

**Interfaces:**

- Consumes: Task 1's architecture finding (`docs/sprint-3-delivery-facts.md`) and the PRD references at lines 100, 311–325.
- Produces: two ADR files and an index. `docs/traceability.md`'s Known gaps gains a pointer to the ADR index; Task 3 does that.

The subtask says _"update ADR-001 and ADR-002 if any architectural decisions were revisited."_ **Neither file exists.** The repo references them at `docs/PRD-wayble.md:100,119,279,311,325`, at `docs/sprint_tasks_and_subtasks.md:73,209` and at `docs/plans/US-08-submit-an-accessibility-report.md:418` — which explicitly hands this gap to `z8v0kmrj56`. So this task writes them from reconstruction and says so.

- [ ] **Step 1: Read the two source accounts before writing**

`docs/PRD-wayble.md:100` (the map fallback: if the geospatial component fails, fetch all ~150 places and filter by Haversine client-side) and `:311–325` (Convex + Expo chosen over NestJS + MongoDB + Docker, rejected 2026-08-10, with a comparison table and the instruction to say the stack change out loud). Read `docs/plans/S0-5-entity-model-accessibility-taxonomy.md` for the house shape of a decision record.

- [ ] **Step 2: Write ADR-001**

Decision: the map uses a geospatial query when the component is healthy, and falls back to fetching all ~150 places and filtering by Haversine client-side when it is not. Consequence, which must be stated: the fallback is O(n) over the whole table and is acceptable only at this dataset size; it is not a scaling strategy, and the day the dataset grows this needs revisiting.

Reconstruct the "Decided" date from the git history of the map spike rather than inventing one:

```bash
git log --format='%ad %s' --date=short --all -- "*geospatial*" "*map-component*" "*mapbox*" | tail -5
```

State the date you find, or write "date not recorded in the repository" if the history does not carry it. A guessed date is worse than an acknowledged gap.

- [ ] **Step 3: Write ADR-002**

Decision: Convex + Expo, over NestJS + MongoDB + Docker, decided 2026-08-10. Consequences to state: the backend is a set of Convex functions with no unique indexes, so the US-08 duplicate guard rests on serializable transactions rather than a schema constraint — Task 3 already records this and the two must agree; and the real-time `useQuery` subscription is what makes the live-update requirement cheap, which is why a stack that would have needed websockets separately was not chosen.

- [ ] **Step 4: Give both a "Revisited?" section with the Task 1 evidence**

Verbatim conclusion, because it is the checkable part:

> Reconsidered in Sprint 3 (07–18 Sep 2026) and **not revisited**. Across the
> window `schema.ts` gained two indexes, both required by US-08's own design;
> no dependency changed; no backend module was restructured; the map stack is
> unchanged in committed history. Evidence: `docs/sprint-3-delivery-facts.md`.
> The fallback in ADR-001 was therefore never exercised — the map was not
> removed from any committed change.

- [ ] **Step 5: Write the index**

`docs/adr/README.md`: one row per ADR — number, title, status, date, and the Sprint 3 outcome. One line under the table naming where the ADRs came from, since they were reconstructed rather than recorded at the time.

- [ ] **Step 6: Verify and commit**

```bash
bunx prettier --check docs/adr/
git add docs/adr/
git commit -m "docs(s4-6): write ADR-001 and ADR-002, which the repo referenced but never had"
```

### Task 3: Re-verify the two delivered rows

**Files:**

- Modify: `docs/traceability.md` — the story matrix, Status, "Where the numbers come from", and the header

**Interfaces:**

- Consumes: Task 1's counts.
- Produces: the US-08 and US-10 rows with current numbers, and a provenance block that the file's existing style requires.

The rows exist and are good. The numbers under them are stale: the doc claims 44 mobile cases for US-08 (now 116 repo-wide in that workspace) and a repo total of 253 (now 296).

- [ ] **Step 1: Replace the number-provenance block**

The file has two such blocks, one per story, and the second says the first "has not been re-measured against the current tree". Replace both with a single block carrying the three commands and their current output from Task 1, plus one line naming the date. Keep the block's honesty: if a split is unverified, say which and why.

- [ ] **Step 2: Update the US-08 row's test cell**

Read the per-suite case counts from Task 1 and put them in. Preserve the existing clause naming what has no coverage — that sentence is the most valuable text in the row and it is still true: `apps/mobile` has no component renderer, so the report components and the route have zero automated coverage.

- [ ] **Step 3: Update the US-10 row's test cell the same way**

Same treatment. Note that US-10's work landed on 2026-09-27, outside the sprint window, and say so in the row or the Index notes — a reader comparing the matrix against the sprint dates should not have to guess why.

- [ ] **Step 4: Fix the header and add the owner legend**

The header says "US-08 and US-10 are mapped so far… the other 12 are outstanding". After Task 4 it is "two delivered, five recorded as not delivered". Correct it, and add the legend: the `Owner` column uses `M1`/`M2`/`M3` from PRD §9, which does not map cleanly onto four people — US-13 is coded M2 but assigned to Nishara Senadheera, while US-11 (M3) and US-23 (M3) are split across two people. Either add a name mapping or switch the column to names. **A panel will ask.**

- [ ] **Step 5: Verify and commit**

```bash
bunx prettier --check docs/traceability.md
git add docs/traceability.md
git commit -m "docs(s4-6): re-measure the US-08 and US-10 traceability rows"
```

### Task 4: Record the five undelivered stories

**Files:**

- Modify: `docs/traceability.md` — the story matrix, Status, Known gaps

**Interfaces:**

- Consumes: Task 1's per-story evidence.
- Produces: five rows, plus a Known gaps entry.

**This is the task that decides whether the deliverable is honest.** Writing `US-13 | Flagging | flagReport | Reports overflow | flagReport.test.ts | M2` for a story with no function, no branch and no test would be fabricating the evidence an SE3080 panel is asked to trust.

- [ ] **Step 1: Write the five rows as status, not as implementation**

Each row follows the same shape, with the PRD's intended design in the Feature cell and the actual state in the others:

```
| US-13 | Flagging — not delivered in `main` | `flagReport` **absent** | no screen | no test file | M2 / Nishara |
```

The Feature cell keeps the PRD's intent, so the matrix still shows what was planned. The Convex function cell says `absent` in bold, which is the fact a reviewer needs first. Where a branch holds the work — US-11 only — name the branch in the screen cell: `on origin/feature/s3-4-…(US-11), not merged`.

- [ ] **Step 2: Add one grouped Status row, not five**

The Status table has one row per story today. Five more rows reading "no
coverage" is repetitive and buries the point. Add two rows:

| US-09, US-13, US-16, US-23 | none — not implemented in `main` | see the delivery-state row and `docs/sprint-3-delivery-facts.md` |
| US-11 | `confidence.ts` unit tests exist on `origin/feature/s3-4-…(US-11)`, **not merged**, so `main` has none | merge or close the branch |

Note the grouping in Index notes, so the absence reads as a decision rather than
an oversight.

- [ ] **Step 3: Add the Known gaps entry**

One entry, in the file's existing voice:

> **Five of the seven Sprint 3 stories are not in `main`.** US-09, US-13 and
> US-16 have no function and no pushed branch. US-11 is complete on an unmerged
> branch. US-23's branch tip predates the sprint. Sprint 3's committed output is
> US-08 and US-10. `docs/sprint-3-delivery-facts.md` holds the evidence. This is
> a delivery gap, not a testing gap, and no amount of test coverage closes it.

- [ ] **Step 4: Add the ADR pointer to Known gaps**

The file's US-08 gap at line 100 says `STEP_TITLES` is `Record<string, string>`
rather than a union keyed by `ReportStep`. That was true when written and is now
fixed — S4-5 re-annotated it as `Record<ReportStep, string>` and the comment in
`StepIndicator.tsx` says plainly that this catches a missing key but not an extra
one, with the key set pinned in `strings.test.ts` instead. **Correct that entry
rather than leaving a resolved gap stated as open.** Add a pointer to
`docs/adr/README.md`.

- [ ] **Step 5: Verify and commit**

```bash
bunx prettier --check docs/traceability.md
git add docs/traceability.md
git commit -m "docs(s4-6): record US-09, US-11, US-13, US-16 and US-23 as not delivered in main"
```

### Task 5: Burndown actuals

**Files:**

- Create: `docs/sprint-3-burndown.md`

**Interfaces:**

- Consumes: Task 1's git distribution finding. **Consumes from the partner: the ClickUp card close dates.**
- Produces: the actuals table, with its source named.

- [ ] **Step 1: Write the source statement first**

> Actuals are taken from ClickUp card close dates, exported by Pasindu Lanka on
> 2026-09-29. They are **not** derived from git: the Sprint 3 window holds 47
> commits, 46 of them dated 2026-09-16, so git dates express a single spike
> rather than a burndown. US-10's ten commits are dated 2026-09-27, nine days
> after the sprint closed.

Put this above the table. A burndown whose provenance is unclear is the exact
artefact PRD:207 warns against.

- [ ] **Step 2: Get the ClickUp export and build the actuals table**

From `docs/sprint_tasks_and_subtasks.md`, Sprint 3 ran 07–18 Sep with 8 parent
tasks and 41 subtasks. For each of the 8 parents: committed date, carried over to
Sprint 4 or closed. If the export is not available, write the table with an
explicit `not available` in every cell and a one-line note that ClickUp is the
source — **do not fill it from git or from the plan's estimated hours.**

- [ ] **Step 3: Add the carry-over, which is the real finding**

Sprint 4's list already names the Sprint 3 work that did not land: S4-2's
on-device testing, S4-3's audit, S4-7's moderator queue (`z8v0kmrj4z` adds the
`role` field to the users table — the schema work for US-13's moderation, which
confirms US-13 never landed). Record which Sprint 3 stories map to which Sprint 4
carry-overs, with the task IDs. That mapping is the useful content; the date
table is the easy part.

- [ ] **Step 4: Verify and commit**

```bash
bunx prettier --check docs/sprint-3-burndown.md
git add docs/sprint-3-burndown.md
git commit -m "docs(s4-6): compile Sprint 3 burndown actuals from ClickUp close dates"
```

### Task 6: The Sprint 3 retrospective

**Files:**

- Create: `docs/sprint-3-retrospective.md`

**Interfaces:**

- Consumes: Task 1's fact base, Task 5's carry-over mapping, and the defect record from S4-5's review.
- Produces: the retrospective.

**Resolve this first:** the subtask says _"SE3080 Assignment 2 sprint
retrospective"_ while the parent task says _"SE3050 report documentation"_.
SE3080 is Assignment 1 — the root `package.json` is `se3080-assignment1`. Confirm
which module this document belongs to before writing, and state the answer in the
document header.

- [ ] **Step 1: Write the header with scope and date**

Name the sprint (07–18 Sep 2026), the team (Pasindu Lanka, Pasindu Janith,
Nishara Senadheera, Aathika Ilmudeen), the stories, and who wrote it.

- [ ] **Step 2: What went well, with evidence rather than adjectives**

Three items, each tied to a fact from Task 1 or the S4-5 record:

- The entity model held. US-08 and US-10 were both added without restructuring
  the schema, which is the strongest available evidence for the S0-5 design.
- The error-classification split worked. `report-errors.ts` and
  `verification-errors.ts` matched backend messages by substring, and both suites
  survived a later refactor of the copy they emit with **no test edits** — byte
  pinned output held across 335 strings moving. That is a real test-design
  success, and it is why the S4-5 refactor was safe at all.
- The plain-language error path paid off. Both stories' duplicate and
  self-verification rejections reach a user as a sentence, and the
  self-verification rejection is server-side and returns an error rather than
  failing silently — a VIVA probe can test it.

- [ ] **Step 3: What to improve, stated as the data states it**

Do not soften these. They are the section's value.

- **Five of seven stories did not land.** US-09, US-13 and US-16 never started;
  US-11 is on an unmerged branch; US-23's branch predates the sprint. The cause
  is knowable and should be named: Sprint 3's committed output is two stories, so
  the question is whether the board's scope was larger than the sprint's capacity,
  or the work was tracked on branches that were never pushed. **Both are
  possible and the repository cannot distinguish them** — say that, and name
  what would distinguish them next time (a weekly branch push, or card status
  moved on the board).
- **US-10 landed nine days after the sprint closed.** The work was done and the
  dates say otherwise, which means the board's close dates were not the truth.
- **A focus ring passed `tsc` and `eslint` twice.** The S3-1 runbook records it
  and it is the strongest argument in the repo for the manual checklists that
  currently have 21 unticked boxes.

- [ ] **Step 4: Action items, each with an owner and a task ID where one exists**

Five, drawn from the work above:

| Action                                                                     | Owner          | Where tracked       |
| -------------------------------------------------------------------------- | -------------- | ------------------- |
| Merge or close the US-11 branch; do not leave Sprint 3 work unmerged       | Nishara        | new                 |
| Confirm whether US-09/13/16 exist unpushed, or are not started             | Pasindu Janith | new                 |
| Add a `test` job to CI — it currently runs lint, format and typecheck only | new            | `z8v0kmrj4q` (S3-8) |
| Add `eslint-plugin-jsx-a11y`; nothing asserts accessibility props today    | new            | new                 |
| Run the manual checklists and tick the 21 boxes                            | all            | S4-1, S4-2          |

The last two are not S4-6's to do; naming them in a retrospective is.

- [ ] **Step 5: Verify and commit**

```bash
bunx prettier --check docs/sprint-3-retrospective.md
git add docs/sprint-3-retrospective.md
git commit -m "docs(s4-6): add the Sprint 3 retrospective"
```

### Task 7: Cross-links and the close-out

**Files:**

- Modify: `docs/traceability.md`, `docs/EDI-compliance-checklist.md`

**Interfaces:**

- Consumes: every artefact Tasks 1–6 produced.
- Produces: a matrix, a checklist and four documents that point at each other, so a reader arriving at any one of them finds the rest.

- [ ] **Step 1: Cross-link from the matrix**

`docs/traceability.md` gains a short "Sprint 3" section near the top: one
paragraph saying the fact base is in `docs/sprint-3-delivery-facts.md`, the ADRs
in `docs/adr/`, the retrospective and burndown named with their paths, and that
the matrix records non-delivery as a first-class state.

- [ ] **Step 2: Link the checklists**

The matrix's manual verification section points at the runbooks; add the S4-5
runbook for the refactored screens, and note that the 21 boxes are still unticked
because no device run has been recorded. **Do not tick any box.** A ticked box
nobody ran is the same fabrication as a fabricated row.

- [ ] **Step 3: Link the EDI checklist back**

`docs/EDI-compliance-checklist.md` gains a line in its "For SE3050" section
pointing at `docs/traceability.md` for the story-to-test mapping, so the two
SE3050 deliverables are reachable from each other.

- [ ] **Step 4: Run the gates and close out**

```bash
bunx prettier --check docs/
bun run check-types && bun run --filter mobile test && bun run --filter @packages/backend test
git log --oneline origin/main..HEAD -- bun.lock   # expect empty
git status --short                                 # expect only the partner's WIP
```

- [ ] **Step 5: Commit**

```bash
git add docs/traceability.md docs/EDI-compliance-checklist.md
git commit -m "docs(s4-6): cross-link the Sprint 3 evidence set"
```

---

## Post-Implementation

- Do not merge. Open a PR when the partner has reviewed.
- S4-6's own numbers go stale the moment a branch merges. Say so in
  `docs/sprint-3-delivery-facts.md` — it is a snapshot of `e6379fc`, and the date
  is on it.
- The follow-on is not a subtask: the four undelivered stories need a Sprint 5
  scope decision, which is a planning conversation rather than documentation.
