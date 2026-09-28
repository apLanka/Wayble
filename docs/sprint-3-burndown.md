# Sprint 3 burndown — actuals

**Sprint window:** 07–18 Sep 2026. **Compiled:** 2026-09-29 for S4-6
(`z8v0kmrj5r`).

## Source of the actuals

> **ClickUp card close dates are the only source that records when each card
> actually closed, and they were not available when this was compiled.** Every
> cell in the "closed" column below reads `not available`.
>
> The actuals are deliberately **not** reconstructed from git, and the reason is
> worth stating rather than leaving as a gap. Of the 47 commits inside the
> Sprint 3 window, **46 share the date 2026-09-16** and 1 is dated 2026-09-07. A
> burndown built from that is a vertical line. Worse, `main` received **no merge
> at all** between 2026-08-29 and 2026-09-26 — the entire sprint window sits
> inside a four-week gap on `main` — so "work done" and "work shipped" are
> different questions with different answers, and git answers only the first.
>
> Method and evidence: [`docs/sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md)
> §2. Re-run the commands there if this document needs updating.

## Planned vs. delivered

Planned figures are from `docs/sprint_tasks_and_subtasks.md`. Delivered state is
from `docs/sprint-3-delivery-facts.md` §1, which cites the command that
establishes it. **"Delivered" means the function PRD §9 names is present in
`main`** — not that work was written, since three of these have code somewhere.

| Task | Story                 | Assignee           | Planned | Priority  | ClickUp closed | In `main`?                           |
| ---- | --------------------- | ------------------ | ------- | --------- | -------------- | ------------------------------------ |
| S3-1 | US-08 submit report   | Pasindu Lanka      | 5h      | 🔴 Urgent | not available  | **yes** — merged 2026-09-28          |
| S3-2 | US-09 photo evidence  | Pasindu Janith     | 3h      | 🟡 High   | not available  | **no** — nothing anywhere            |
| S3-3 | US-10 confirm/dispute | Pasindu Lanka      | 5h      | 🔴 Urgent | not available  | **yes** — merged 2026-09-28          |
| S3-4 | US-11 confidence      | Nishara Senadheera | 5h      | 🔴 Urgent | not available  | **no** — unmerged branch             |
| S3-5 | US-16 needs ranking   | Pasindu Janith     | 5h      | 🔵 Normal | not available  | **no** — nothing anywhere            |
| S3-6 | US-13 flagging        | Nishara Senadheera | 2h      | 🔵 Normal | not available  | **no** — nothing anywhere            |
| S3-7 | US-23 live feed       | Aathika Ilmudeen   | 3h      | 🔴 Urgent | not available  | **no** — branch predates sprint      |
| S3-8 | Regression & CI green | Aathika Ilmudeen   | 3h      | 🟡 High   | not available  | **no** — CI has no `test` job at all |

**8 parent tasks, 46 subtasks, 31 hours planned. Two stories delivered.**

## The triage rule the PRD already wrote

`docs/PRD-wayble.md:305` anticipated this outcome, and named the victims before
it happened:

> "(2) US-16 and US-13 are the drop candidates if time runs out — **drop them
> explicitly in the retrospective**, do not let them rot half-built."

**Both were dropped. Neither was recorded.** US-16 and US-13 are among the five,
and no retrospective existed to say so. The instruction was followed in the
outcome and missed in the record, which is the one way a triage rule can fail:
it worked, and nobody wrote it down, so the next sprint re-derives the same
argument from scratch.

The rule also under-called it. It named two drop candidates; five stories did
not land, so US-09, US-11 and US-23 went without a decision being taken at all.

## What carried into Sprint 4

This is the part with actual value, because it is measurable and forward-looking:
Sprint 4's list is already written around the gaps.

| Sprint 4 task                                                                                        | Depends on                        | State                                                                               |
| ---------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| S4-2 `z8v0kmrj4u` — "Run T1-T3 tasks + T4 Confirm someone else's report + **T5 Read the live feed**" | T4 → US-10 ✅ · **T5 → US-23 ❌** | **5h task with an unrunnable subtask**                                              |
| S4-7 `z8v0kmrj4z` — "Add role field to users table schema: 'user' \| 'moderator'"                    | US-13's moderation                | **the `role` field and the `flags` table have both existed since July** — see below |
| S4-8 Flow 3 Contribution                                                                             | US-08 ✅                          | runnable                                                                            |
| S4-8 Flow 4 Verification                                                                             | US-10 ✅                          | runnable                                                                            |
| S4-1, S4-3 user testing and WCAG audit                                                               | whatever exists                   | scoped to delivered screens                                                         |

So two of Sprint 4's eight tasks already assume work that Sprint 3 did not
deliver — and S4-7 is the more interesting case, because it is the opposite of
what its own card says:

```bash
$ git show 32f946e:packages/backend/convex/schema.ts | grep -nE "role:|flags:"
  115:    role: v.optional(userRoleValidator),
  174:  flags: defineTable({
```

`32f946e` is 2026-08-29, 9 days _before_ Sprint 3 opened. **The `role`
field and the `flags` table both already existed.** So S4-7's `z8v0kmrj4z` —
"Add role field to users table schema" — is a **stale ClickUp card**, not
evidence of a gap, and the flagging story's schema was ready before the sprint
began. What US-13 never built is the `flagReport` mutation and the FlagAction UI.

That is a stronger finding than the one it replaces. The story was not blocked on
data modelling; it was not built, while its table sat empty.

## To complete this document

1. Export the ClickUp close date for `z8v0kmrg21` … `z8v0kmrg28` and fill the
   "closed" column.
2. Re-derive the burndown curve from those dates. Do not fill the column from
   commit dates, from the `Est. Time` figures, or from the due dates in the task
   document — the due dates are all identical (18 Sep) and carry no information
   about when anything finished.
3. Re-check the "In `main`?" column against `docs/sprint-3-delivery-facts.md` §1
   at the time of writing, since merging the US-11 branch changes two rows.
