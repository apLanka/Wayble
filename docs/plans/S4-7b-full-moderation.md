# S4-7b — Full moderation: remove report, moderator notes, history (US-14)

**Sprint:** 4 · **Builds on:** [S4-7 moderator queue](S4-7-moderator-queue-screen.md) · **Related:** US-13 (flags)

---

## Problem

S4-7 let a moderator only _dismiss_ flags. A report that really is spam or abusive stays visible, and
nothing records what a moderator decided or why. This slice completes US-14: remove a report, attach a
note to a decision, and review past decisions.

## Non-goals

- Notifying the report's author, appeal flow, role management UI (roles stay set via `moderation:setUserRole`).
- Restoring a removed report.

## Decisions

| Topic                | Decision                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Remove"             | Set `reports.status = "removed"` (already in the schema). `reports.listForPlace` and `places.getPlace` already only count `active` reports, so the report disappears with no change there. |
| Flag outcome         | Removing sets the report's open flags to `resolved`; dismissing keeps `dismissed`. History derives the outcome from that status — no extra field.                                          |
| Note                 | New optional `flags.resolutionNote` (one-field additive schema change, no migration). Trimmed; blank ⇒ none; max `MAX_NOTE_LENGTH` (280).                                                  |
| Gate                 | Same `requireModerator` (strict `moderator`).                                                                                                                                              |
| Removing needs flags | `removeReport` only acts on a report with ≥1 open flag, mirroring `dismissFlag` ("No open flags on this report"), so it is a moderation decision, not a free delete.                       |
| Already removed      | A removed report that still has open flags can't be removed twice: `"Report already removed"`.                                                                                             |

## Backend — `convex/moderation.ts` (extended)

- `dismissFlag({ reportId, note? })` — adds the optional note; return value unchanged (count).
- `removeReport({ reportId, note? })` — moderator-gated; report must exist and be `active`; open flags
  required; patches the report (`status: "removed"`, `updatedAt`) and every open flag
  (`status: "resolved"`, `resolvedBy`, `resolvedAt`, `resolutionNote`). Returns the number of flags resolved.
- `getResolvedFlags` — moderator-gated, history newest-first (max 50). Groups closed flags by
  (`reportId`, `resolvedAt`) — one decision = one group, since all flags of a decision share a timestamp.
  Item: `{ reportId, placeName, summary, outcome: "removed" | "dismissed", flagCount, reasons[], resolutionNote?, resolvedByName, resolvedAt }`.
- `schema.ts`: `flags.resolutionNote: v.optional(v.string())`.

## Mobile (`apps/mobile/components/moderator/`)

| File                            | Change                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `moderation-errors.ts`          | + `alreadyRemoved`, `noteTooLong` kinds; failure copy takes the action ("dismiss" / "remove"). |
| `moderation-history.ts` (+test) | Pure: `OUTCOME_LABELS`, `normalizeNote`, `describeHistoryItem`.                                |
| `ResolveDialog.tsx`             | Modal with optional note field and Cancel / Confirm. Used for both Dismiss and Remove.         |
| `FlaggedReportRow.tsx`          | Dismiss **and** Remove buttons, per-action busy state.                                         |
| `HistoryRow.tsx`                | One past decision: outcome, place, reasons, note, moderator, time.                             |
| `ModeratorQueueScreen.tsx`      | "Open" / "History" tabs, dialog state, remove + dismiss wired through the dialog.              |

Accessibility: tabs are `tab` role with selected state; dialog buttons ≥44dp and labelled; outcomes are
announced ("Report removed.", "Flags dismissed.").

## Testing

- `convex/testing/moderation.test.ts` (extended): remove gating, remove effect (report + flags + note),
  double remove, no open flags, note trimming/length, dismiss note, history content/order, history gating.
- `convex/testing/e2e/moderation.e2e.test.ts` (new): member flags → moderator removes → report vanishes
  from `listForPlace`, drops out of the queue, shows in history.
- `moderation-errors.test.ts`, `moderation-history.test.ts`.
- Type-check + lint; deploy functions (`convex dev --once`) before running the app.

## Manual check

1. Promote your account: `npx convex run moderation:setUserRole '{"email":"<you>","role":"moderator"}'`.
2. As a second user, flag a report (place → Reports → ⋯ → flag).
3. As the moderator open Profile → Moderation queue → **Remove**, add a note, confirm.
4. The row leaves the queue; the report is gone from the place; **History** shows "Removed" with the note.
