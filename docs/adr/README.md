# Architecture Decision Records

Wayble has two. Both are referenced throughout the PRD and both were written on
**2026-09-29**, during Sprint 4 task S4-6 (`z8v0kmrj56`), from
reconstruction.

## Index

| #                                         | Title                                                         | Status   | Decided    | Sprint 3 outcome                                                                         |
| ----------------------------------------- | ------------------------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------- |
| [0001](./0001-map-geospatial-fallback.md) | Map rendering: Mapbox GL with a documented Haversine fallback | Accepted | 2026-08-18 | Reconsidered, **not revisited**; the fallback was never exercised                        |
| [0002](./0002-convex-and-expo-stack.md)   | Convex + Expo over NestJS + MongoDB + Docker                  | Accepted | 2026-08-10 | Reconsidered, **not revisited**; the stack held while five of seven stories did not land |

## Why these were written late

The repository referenced `ADR-001` and `ADR-002` in nine places —
`docs/PRD-wayble.md:100,119,279,311,313,325`,
`docs/sprint_tasks_and_subtasks.md:73,209` and
`docs/plans/US-08-submit-an-accessibility-report.md:418` — and contained no ADR
file at all. The gap was noticed during Sprint 3 and explicitly handed to
`z8v0kmrj56` by `docs/plans/US-08-submit-an-accessibility-report.md:418`, which
says so in its "Known gaps".

Two consequences for a reader:

- **The dates are reconstructed, not recorded.** 0002's 2026-08-10 is the PRD's
  account of when NestJS was rejected. 0001's 2026-08-18 is the merge date of the
  S0-6 spike branch. Neither came from a written decision at the time.
- **The Sprint 0 retrospective that `docs/PRD-wayble.md:325` says should hold
  ADR-002's rationale does not exist.** 0002 cites the PRD's comparison table
  instead, and the PRD's instruction to "say the stack change out loud" is
  carried into 0002's Context rather than left as a note.

## On the numbering

The PRD uses **"ADR-001/002" as a compound reference** in three places:
`docs/PRD-wayble.md:100` (the geospatial fallback), `:119` (S0-6, the map SDK
and geospatial spike) and `:279` (the rubric row for "Tech Stack Justification
& Novel Tech"). One record cannot be both a map decision and a stack decision, so
these are split:

- **0001 — the map.** What SDK, and what happens when the beta geospatial
  component fails.
- **0002 — the stack.** Convex + Expo over NestJS + MongoDB + Docker, and the
  risk accepted by taking it.

The compound reference is best read as "the map-and-stack decision area". If the
team intended a different split, renumbering these two files is the only change
needed; nothing else in the repository depends on the numbers.

## Format

MADR. These two are the first decision records this project has, so they set the
precedent: Status, Date, Context, Decision, Consequences, and a **Revisited?**
section that says what was checked and what the answer was.

The `Revisited?` section is not decoration. PRD:207's warning — that claiming
something and failing a VIVA probe costs more than not claiming it — applies to
architecture records as much as to features, and a decision record with no
revisit history is a record of an intention rather than of a decision.
