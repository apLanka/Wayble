# Sprint 3 retrospective

**Sprint:** 07–18 Sep 2026 · **Stories:** US- **US-11 was finished in the sprint's first three days.** 15 branch-only commits dated **2026-09-07 to 09-09** — the scoring module, the badge component, the place-detail wiring and the unit tests. The branch then went idle for **20 days**, its only later activity a merge of `main` and a generated-types sync. This story is not late and not unwritten: it is _finished and invisible_, which is a different failure and a much cheaper one to fix.md:17` splits the codebase across two rubrics, and the S4-6
subtask names look contradictory because each is right about its own artefact:

> "The task breakdown is an **SE3080 Assignment 1** artefact (sprints, story
> points, burndowns, ADRs, retrospectives). This PRD serves **SE3050 Assignment 1**
> (UX process, EDI, prototype, testing, branding, VIVA). Same codebase, two
> rubrics."

So **this retrospective, the burndown and the two ADRs are SE3080** process
evidence, and the traceability matrix and EDI checklist are **SE3050**. S4-6 is
the one task that feeds both. Nothing needs correcting; it just needed saying,
because a reader hitting both rubrics in one task list would reasonably ask.

## Outcome in one paragraph

Sprint 3 planned 8 parent tasks, 46 subtasks and 31 hours, and delivered **two
stories**: US-08 and US-10. The other five — US-09, US-11, US-13, US-16 and
US-23 — are not in `main`. Both delivered stories reached `main` in a **single
merge on 2026-09-28**, ten days after the sprint closed, on a branch named
`chore/strip-claude-coauthor`. Every figure here is in
[`docs/sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md), which cites
the command behind each one.

---

## What went well

**The entity model absorbed a sprint of features without being redesigned.**
`schema.ts` changed by four lines in two hunks: one net index added —
`by_place_and_author`, which exists only because US-08's duplicate guard needed a
single indexed read — and `verificationVerdictValidator` became exported so
`verifications.ts` could reuse it. Two backend modules and three test files were
added and **nothing was restructured or removed**. The S0-5 taxonomy, agreed
before any feature work, is the reason a whole sprint of features needed no
schema renegotiation. That is the strongest return on a design decision this
project has.

**The error-classification split survived a 335-string refactor untouched.**
`report-errors.ts` and `verification-errors.ts` classify a backend failure into a
kind, and a separate function maps that kind to user-facing copy. When S4-5 moved
every user-facing string in the app into `constants/strings.ts`, it edited
neither `utils/format-relative-time.test.ts` nor
`components/place/verification-tally.test.ts` — both still pass, unmodified.
Those suites assert **exact strings**, so they held only because the copy's
_home_ changed while its _output_ did not. That is test design paying for itself
months later, and it is why the refactor was safe at all.

**The plain-language failure path is real and server-enforced.** A duplicate
submission and a self-verification attempt both reach the user as a sentence
rather than a stack trace, and self-verification is **rejected by the mutation**
instead of being hidden in the UI — so it holds against any client, not just
this one. `docs/traceability.md` records that Convex has no unique indexes, so
the 24-hour duplicate guard rests on serializable transactions; that guarantee
is understood, documented, and has a named cheap guard.

---

## What to improve

**Five of seven stories did not land, and no decision recorded it.** But the
reasons are not the same, and collapsing them loses the one that is fixable this
week:

- **US-11 was written on the sprint's first day.** `confidence.ts` is dated
  **2026-09-07** — 07 Sep, the day Sprint 3 opened. It has been sitting on an
  unmerged branch for **22 days**, and the branch's only activity since is a
  generated-types sync. This story is not late and not unwritten: it is
  _finished and invisible_, which is a different failure and a much cheaper one
  to fix.
- **US-09, US-13 and US-16 have no code and no pushed branch anywhere.**
- **US-23's branch tip is dated 2026-08-29** — 9 days before the sprint opened —
  and holds no implementation. That one looks like it never started.

**The PRD already told us this would happen, and told us what to do about it.**
`docs/PRD-wayble.md:305`:

> "(2) US-16 and US-13 are the drop candidates if time runs out — **drop them
> explicitly in the retrospective**, do not let them rot half-built."

Both were dropped. Neither was recorded, because no retrospective existed. **The
triage rule worked and the record of it was lost** — which is the only way a
good rule can fail. The rule also under-called it: two candidates were named and
five stories went undelivered, so US-09, US-11 and US-23 left without anyone
deciding.

**The board's dates and the repository's do not agree.** `main` received no
merge between 2026-08-29 and 2026-09-26 — the entire sprint window sits inside
that gap. Sprint 3's whole output then shipped as one merge on 2026-09-28, on a
branch named for a chore. Two consequences: a burndown cannot be reconstructed
from the repository at all, and anyone reading the board's close dates would
draw a different picture from anyone reading `git log`. **Merging is the
missing ceremony**, not estimating.

**Defects reached review that no automated check could catch.** The US-10 manual
checklist exists because review found "an invisible focus ring that passed both
`tsc` and `eslint` twice, an announce gate whose bug is only observable by racing
two taps, and a signed-out screen that read as a dead end"
(`docs/traceability.md`). **21 of those boxes are still unticked**, because no
device run has been recorded. Sprint 4 wrote two more runbooks
(`S3-1-S3-3` and `S4-5`) and both are unrun.

**Two claims outran their evidence, and review caught both.** During the S4-5
refactor the profile nav row's "My accessibility needs" was pointed at the
settings card's "Accessibility needs" key, collapsing two of three surfaces
into one. The EDI checklist then said the guard made the localisation claim
unfalsifiable; it cannot, because a ternary inside a JSX expression is invisible
to it. **The copy did not ship changed** — `constants/strings.ts` now holds all
three sentences as distinct keys, and the checklist states the guard's limits. The
value here is not that the bugs existed; it is that a review of a 50-file refactor
found two copy regressions that `tsc`, `eslint` and 116 green tests had all
passed.

---

## Action items

| #   | Action                                                                                                                                                                 | Owner              | Where tracked       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------- |
| 1   | **Merge or close the US-11 branch today.** It was finished on 07 Sep and has been unmerged for 22 days. The other four stories need scoping; this one needs a button.  | Nishara Senadheera | new                 |
| 2   | Establish whether US-09, US-13 and US-16 exist unpushed or were never started, and record which. This is the difference between a tracking problem and a delivery one. | Pasindu Janith     | new                 |
| 3   | **Add a `test` job to CI.** It runs lint, format and typecheck and no tests, so a green badge is not evidence of anything.                                             | new                | `z8v0kmrj4q` (S3-8) |
| 4   | **Add `eslint-plugin-jsx-a11y`.** Nothing in the repo asserts that an interactive element has a label.                                                                 | new                | new                 |
| 5   | Run the manual checklists and tick the 21 boxes.                                                                                                                       | all                | S4-1, S4-2          |
| 6   | Move a story off the board and into a written decision when it is dropped, in the same week.                                                                           | all                | new                 |

Actions 3 and 4 are not S4-6's to complete; they are named here because a
retrospective that only lists its own follow-ups is a list, not a retrospective.

---

## For the next sprint

Two things to carry, both of which are free:

**Write the retrospective during the sprint, not after it.** The PRD named the
drop candidates in advance and asked for the decision to be recorded explicitly.
Recording it afterwards required reconstructing the outcome from a four-week
merge gap, and it still cannot say when the cards closed.

**Treat a merge as the definition of done.** A card is not done when the code is
written; it is done when the branch is merged. On this evidence that single change
would have moved "delivered" from 2 to 2 with a date attached — and would have
made the burndown reconstructable, which right now it is not.
