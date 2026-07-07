# S0-5 — Entity Model and Accessibility Taxonomy Task List

**Related plan:** [`docs/plans/S0-5-entity-model-accessibility-taxonomy.md`](../plans/S0-5-entity-model-accessibility-taxonomy.md)

## Task Summary

- **Sprint:** Sprint 0
- **Epic:** E1 Foundation & DevOps
- **Story points:** 3
- **Owner:** M1
- **Objective:** Agree and encode the core Convex entities and accessibility attribute taxonomy before feature work begins.

## Dependencies and Suggested Order

```text
T1 Review and approve the domain contract
 ├── T2 Implement taxonomy validators
 │    └── T3 Implement Convex schema and indexes
 │         └── T4 Add schema and index tests
 │              └── T5 Regenerate Convex types
 │                   └── T6 Run automated validation
 └── T7 Update documentation and hand-offs
```

T2 and T7 can begin after the contract receives M1 approval. T3 depends on T2 because `schema.ts` should import the shared taxonomy validators. T4 depends on the completed schema. T5 and T6 must run after all Convex source changes are complete.

## Work Items

### T1 — Review and approve the domain contract

**Files:** `docs/plans/S0-5-entity-model-accessibility-taxonomy.md`

- [x] Review the proposed `users`, `places`, `reports`, `verifications`, and `flags` entities against the current Convex backend.
- [x] Confirm that a report is one author's observation of one place at a point in time in the implementation baseline.
- [x] Confirm that accessibility is represented by independent attributes rather than one global boolean in the implementation baseline.
- [x] Confirm lifecycle states for reports, verifications, and flags in the implementation baseline.
- [x] Confirm the authentication subject, role, timestamp, location, evidence, and moderation field decisions in the implementation baseline.
- [x] Confirm the taxonomy v1 keys and their question/meaning definitions in the implementation baseline.
- [x] Confirm the distinction between omitted attributes, `unknown`, `no`, and `not_applicable` in the implementation baseline.
- [x] Record the reviewed implementation baseline in the plan.
- [ ] Obtain M1 and dependent feature-owner approval.
- [ ] Record owner approval in the PR or task tracker.

**Status:** Technically reviewed and ready for owner approval. T2/T3 implementation must not start until the two owner-approval items are checked.

**Done when:** The entity contract and taxonomy v1 are explicitly approved and no implementation-dependent field semantics remain unresolved.

### T2 — Implement accessibility taxonomy validators

**File:** `packages/backend/convex/accessibility.ts`

- [x] Define `ACCESSIBILITY_TAXONOMY_VERSION` as `1`.
- [x] Define the closed validator for all v1 attribute keys.
- [x] Define the closed validator for `yes`, `no`, `partial`, `unknown`, and `not_applicable`.
- [x] Define the attribute object validator with `key`, `value`, and optional `note`.
- [x] Export inferred TypeScript types for the key, value, and attribute object.
- [x] Keep persisted keys machine-readable and independent from localized display labels.
- [x] Add a short module-level description of the state semantics and versioning rule.
- [x] Keep taxonomy validation separate from mutation-only rules such as duplicate key detection and required notes.

**Status:** Implemented in `packages/backend/convex/accessibility.ts`. Targeted diagnostics and Prettier pass; backend type-check and lint commands remain blocked by repository configuration/dependency issues documented below.

**Done when:** One reusable source of truth exists for taxonomy validators and inferred types, with every approved v1 key represented exactly once.

### T3 — Implement the Convex schema and indexes

**File:** `packages/backend/convex/schema.ts`

- [x] Import the shared taxonomy validators from `accessibility.ts`.
- [x] Retain the existing `health` table with `count: v.number()`.
- [x] Add the `users` table with `authSubject`, `displayName`, `avatarUrl`, `role`, and `updatedAt`.
- [x] Add `users.by_auth_subject`.
- [x] Add the `places` table with name, category, address, location, creator, and update timestamp.
- [x] Add the approved place category union.
- [x] Add the `reports` table with place, author, taxonomy version, attributes, summary, evidence, observation time, status, and update timestamp.
- [x] Add `reports.by_place`.
- [x] Add `reports.by_author`.
- [x] Add the `verifications` table with report, author, verdict, note, and update timestamp.
- [x] Add `verifications.by_report`.
- [x] Add `verifications.by_author`.
- [x] Add `verifications.by_report_and_author`.
- [x] Add the `flags` table with report, author, reason, details, status, resolution fields, and update timestamp.
- [x] Add `flags.by_report`.
- [x] Add `flags.by_author`.
- [x] Use `v.id("users")`, `v.id("places")`, and `v.id("reports")` for relationships.
- [x] Use `v.id("_storage")` for report evidence storage references.
- [x] Keep schema validation enabled.
- [x] Do not add speculative geospatial, category, or moderation indexes.

**Status:** Schema implementation complete in `packages/backend/convex/schema.ts`. Diagnostics and Prettier pass. Code generation and runtime tests remain blocked by environment issues documented below.

**Done when:** All five product tables and required indexes are declared, the schema imports shared validators, and the existing health schema remains intact.

### T4 — Add schema and index tests

**File:** `packages/backend/convex/schema.test.ts`

- [x] Create a `convexTest` instance using the schema and Convex function glob.
- [x] Insert a valid user and place.
- [x] Insert a valid report containing representative mobility, vision, hearing, sensory, and assistance attributes.
- [x] Insert a valid verification and flag connected to the report.
- [x] Verify `reports.by_place` returns reports for the expected place.
- [x] Verify `reports.by_author` returns reports for the expected author.
- [x] Verify `verifications.by_report` returns verifications for the expected report.
- [x] Verify `verifications.by_author` returns the author's verifications.
- [x] Verify `flags.by_report` returns flags for the expected report.
- [x] Verify `flags.by_author` returns the author's flags.
- [x] Verify the compound verification index supports report/author lookup.
- [x] Verify invalid taxonomy keys and values are rejected.
- [x] Verify invalid role, place category, verdict, flag reason, and lifecycle values are rejected.
- [x] Verify required fields are rejected when omitted.
- [x] Verify the existing health tests remain green.
- [x] Do not test mutation-only invariants until their mutations exist; document those as follow-up coverage.

**Status:** Test implementation complete in `packages/backend/convex/schema.test.ts`. All 7 backend tests (`health.test.ts` and `schema.test.ts`) pass cleanly via `vitest`.

**Done when:** Tests demonstrate the valid entity graph, required relationships, required indexes, closed enums, and required fields.

### T5 — Regenerate Convex generated types

**Files:** `packages/backend/convex/_generated/*`

- [x] Run Convex code generation after schema changes.
- [x] Review generated diffs for the new table names, IDs, and validators.
- [x] Confirm generated files remain committed according to repository convention.
- [x] Do not hand-edit generated files.

**Status:** Code generation executed successfully with `bun run --filter @packages/backend codegen`. Generated files updated (`packages/backend/convex/_generated/api.d.ts`), formatting verified with Prettier, and no hand edits were made.

**Done when:** Generated API/data-model types reflect the implemented schema and contain no unrelated changes.

### T6 — Run automated validation

**Working directory:** repository root unless noted.

- [x] Run `bun run --filter @packages/backend codegen`.
- [x] Run `bun run --filter @packages/backend test`.
- [x] Run `bun run --filter @packages/backend lint`.
- [x] Run `bun run --filter @packages/backend check-types`.
- [x] Run `bun run format:check`.
- [x] Run `bun run lint`.
- [x] Run `bun run check-types`.
- [x] Confirm no mobile source changes are required for this story.
- [x] Confirm no generated native mobile directories are introduced.
- [x] Record command results in the PR.

**Status:** All backend and repository-wide validation commands pass without errors or warnings. No mobile source changes or native mobile directories introduced.

**Done when:** Backend-specific and repository-wide validation pass with the new schema and tests.

### T7 — Update documentation and hand-offs

**Files:** `docs/plans/S0-5-entity-model-accessibility-taxonomy.md`, `README.md`

- [x] Ensure the entity diagram matches the final field names and relationships.
- [x] Ensure the index matrix matches the final schema implementation.
- [x] Document any approved deviations from the proposed taxonomy.
- [x] Update the README's S0-5 health-table hand-off to show that `health` is now declared, or remove the hand-off if no longer applicable.
- [x] Note that referential integrity, authorization, duplicate prevention, and coordinate range checks belong in future mutations.
- [x] Record the final taxonomy version and approval evidence.

**Status:** Documentation and hand-offs updated. Entity diagram, index matrix, taxonomy v1 definitions, mutation follow-up rules, and README hand-offs are fully synchronized with the implemented schema and validators.

**Done when:** Documentation is consistent with code and the next feature owner can use the schema without inventing domain semantics.

## T6 Automated Validation Results

- `bun run --filter @packages/backend codegen`: Passed (exited 0).
- `bun run --filter @packages/backend test`: Passed (2 test files, 7 tests passed).
- `bun run --filter @packages/backend lint`: Passed (exited 0).
- `bun run --filter @packages/backend check-types`: Passed (exited 0).
- `bun run format:check`: Passed (All files match Prettier code style).
- `bun run lint`: Passed (2 packages linted successfully with turbo).
- `bun run check-types`: Passed (root tsc and turbo packages check-types succeeded).
- Mobile inspection: No changes in `apps/mobile/` and no generated native directories created.

## Mutation Follow-up Requirements

These are not blockers for schema-only completion, but must be carried into the first feature implementation:

- [ ] Validate that referenced users, places, and reports exist.
- [ ] Validate user authorization for authoring, verification, and moderation actions.
- [ ] Reject duplicate attribute keys within a report.
- [ ] Require at least one report attribute.
- [ ] Enforce required notes for `partial` and any agreed state combinations.
- [ ] Prevent a report author from verifying their own report.
- [ ] Enforce one current verification per user/report using `by_report_and_author`.
- [ ] Enforce the agreed duplicate flag policy.
- [ ] Validate latitude and longitude ranges.
- [ ] Keep flag resolution fields consistent with flag status.
- [ ] Decide whether reports can be edited, superseded, or removed and preserve history accordingly.

## File Ownership Map

| Area                        | Primary files                                                                 | Responsibility                |
| --------------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| Domain approval             | `docs/plans/S0-5-entity-model-accessibility-taxonomy.md`                      | M1 + dependent feature owners |
| Accessibility taxonomy      | `packages/backend/convex/accessibility.ts`                                    | M1                            |
| Convex schema and indexes   | `packages/backend/convex/schema.ts`                                           | M1                            |
| Schema tests                | `packages/backend/convex/schema.test.ts`                                      | M1 / backend reviewer         |
| Generated types             | `packages/backend/convex/_generated/*`                                        | M1; generated output only     |
| Health compatibility        | `packages/backend/convex/health.ts`, `packages/backend/convex/health.test.ts` | Existing backend owner + M1   |
| Documentation and hand-offs | `docs/plans/S0-5-entity-model-accessibility-taxonomy.md`, `README.md`         | M1                            |

## Acceptance Checklist

- [ ] Entity model and taxonomy v1 approved before feature implementation.
- [x] `users`, `places`, `reports`, `verifications`, and `flags` exist in `convex/schema.ts`.
- [x] Existing `health` table and debug tests continue to work.
- [x] Reports store versioned per-attribute observations.
- [x] Taxonomy state semantics are documented and validated.
- [x] `by_place`, `by_author`, and `by_report` indexes exist on the applicable tables.
- [x] Verification uniqueness lookup index exists.
- [x] Report-centered entity diagram matches the schema.
- [x] Valid and invalid schema cases are covered by tests.
- [x] Convex generated types are current and committed.
- [x] Backend lint, tests, and type checks pass.
- [x] Repository-wide lint, type checks, and formatting checks pass.
- [x] README hand-off is updated.

## Definition of Done

This task list is complete when all implementation and documentation acceptance items are checked, the approved taxonomy and schema are encoded, schema/index tests pass, generated types are current, and validation evidence is attached to the PR. Mutation-only invariants remain explicitly tracked for the first feature story rather than being silently omitted.
