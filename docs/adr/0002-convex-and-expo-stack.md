# 0002. Convex + Expo over NestJS + MongoDB + Docker

**Status:** Accepted — reconsidered in Sprint 3, not revisited. See
[Revisited?](#revisited).
**Decided:** 2026-08-10
**Owners:** Sprint 0, whole team

> **On this record's provenance.** The repository referenced "ADR-002" at six
> places — `docs/PRD-wayble.md:100,119,279,311,313,325` — but no ADR file was
> ever written, and the Sprint 0 retrospective that PRD:325 says should hold the
> rationale does not exist either. This record is reconstructed on 2026-09-29
> from the PRD's comparison table and the code. The 2026-08-10 date is the PRD's
> account of the rejection, not a written record. See `docs/adr/README.md`.

## Context

The v1 plan specified **NestJS + MongoDB + Docker**. On 2026-08-10 the team
re-evaluated it and chose **Convex + Expo** instead. The PRD's instruction was
explicit about how to handle this: _"Say the stack change out loud. A panel that
finds NestJS in the charter and Convex in the repo sees a careless one."_

This record is that statement.

## Decision

Adopt **Convex (backend) + Expo (client)**, in a single TypeScript codebase,
replacing the NestJS + MongoDB + Docker plan.

The comparison, from `docs/PRD-wayble.md:313`:

| Criterion         | Convex + Expo _(chosen)_                                                                      | NestJS + MongoDB + Docker _(v1, rejected 10 Aug)_  | Flutter + Firebase         |
| ----------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------- |
| Effort            | ~15–20% less: no API server, no DTOs, no auth guards, no Docker, no Atlas, no separate deploy | Full backend service to build and operate          | Middle                     |
| Language          | One TypeScript codebase, client + server                                                      | TS both sides, two runtimes and a network contract | Dart + JS                  |
| Real-time         | `useQuery` reactivity is native                                                               | Sockets to build and maintain                      | Firestore listeners        |
| Geospatial        | `queryNearest` + `filterKeys` — filter before documents load                                  | Mongo geo queries, mature                          | GeoFlutterFire (community) |
| File storage      | Built in — no bucket, no signed URLs, no third-party account                                  | Cloudinary or GridFS decision required             | Firebase Storage           |
| Accessibility     | RN a11y props map to TalkBack/VoiceOver; `AccessibilityInfo` API                              | n/a (client-independent)                           | Good semantics API         |
| **Risk accepted** | **Geospatial component is beta**                                                              | Mature but slower                                  | Fewest team skills         |

## Consequences

**Gained.**

- **No backend service to build or operate.** No Docker, no deployment
  pipeline, no connection pool, no DTO layer. For a four-person student team this
  is the difference between shipping features and shipping infrastructure.
- **Realtime is free.** `useQuery` subscribes; no socket layer exists to get
  wrong. This is load-bearing for US-23's live activity feed, which the PRD
  explicitly says _"exists only because of it"_.
- **Testing is in-memory.** `convex-test` runs a real deployment in a test
  context, so 162 backend assertions execute in about a second with no
  deployment, no database and no network.
- **One language.** The client, the schema validator and the mutation are
  TypeScript, and a type error in a Convex function is a type error in the same
  editor as the screen that calls it.

**Accepted, and must be written down rather than discovered.**

- **The geospatial component is beta.** Mitigated by a documented fallback —
  see [ADR-0001](./0001-map-geospatial-fallback.md).
- **Convex has no unique indexes.** This is the sharpest consequence in the
  codebase, and it produced a real design consequence rather than an abstract
  one: **US-08's 24-hour duplicate guard rests on Convex's serializable
  transactions, not on a schema constraint.** The guard is a single mutation that
  re-reads and rejects on conflict, which is correct, but rewriting it onto the
  unbounded `by_author` index or splitting it in two would remove the guarantee
  with **no test failing**. This is recorded as a known gap in
  `docs/traceability.md` and the cheap guard is named there: a regression test
  pinning the compound index.
- **The realtime advantage was partly unrealised.** US-23, the story that most
  directly cashes in `useQuery` reactivity, is the one that did not reach `main`
  — see `docs/sprint-3-delivery-facts.md` §1. The decision stands; the
  justification is currently less demonstrated than it was.

## Revisited?

**Reconsidered in Sprint 3 (07–18 Sep 2026) and not revisited.**

Measured against `32f946e` (the last merge before the Sprint 3 window):

- Two backend modules were **added** — `convex/reports.ts` and
  `convex/verifications.ts`, plus `convex/reportLimits.ts`. Nothing was
  restructured, renamed or removed. A stack change would have shown as
  restructuring.
- **No runtime dependency changed.** Two dev dependencies were added
  (`vitest`, `sf-symbols-typescript`) and a `test` script was added to
  `apps/mobile/package.json`. The root already had a `test` script, and
  `packages/backend/package.json` is byte-identical across the window.
- `schema.ts` changed by four lines in two hunks: `verificationVerdictValidator`
  becomes exported so `verifications.ts` can reuse it, and one index is added.
  No table was added, removed or renamed.
- The stack in `package.json` is unchanged: same workspaces, same two runtimes.

**Worth recording honestly:** the stack question and the delivery question are
not the same, and a team can defend its architecture while missing five of seven
sprints' stories. This record is about the architecture, and the architecture held.

Full evidence: `docs/sprint-3-delivery-facts.md` §4.
