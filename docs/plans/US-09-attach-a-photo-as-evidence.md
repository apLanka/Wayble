# US-09 — Attach a photo as evidence

**Sprint:** 3 (S3-2) · **Points:** 3
**Related:** US-08 (submit a report — the wizard this extends) · US-10 (reports screen that shows the thumbnail) · US-13 (flag — `privacy` reason covers bad photos)

---

## Problem

A report is text only. A photo of the ramp, the lift button panel or the bathroom door is the
fastest way for the next visitor to judge whether a place works for them, and it makes a report
easier to confirm or dispute. This ticket adds one optional photo to a report.

## What already exists

- `reports.evidence: v.array(v.object({ storageId: v.id("_storage"), caption: v.optional(v.string()) }))`
  is already in `schema.ts`. `submitReport` always writes `evidence: []`. **No schema change is needed.**
- The wizard (`app/report/[placeId].tsx`) keeps all draft state local and writes nothing until the
  final submit. This plan keeps that property.
- `apps/mobile` has no component renderer; anything worth unit-testing has to live in a pure `.ts`
  module (same pattern as `report-draft.ts`, `report-errors.ts`).

## Non-goals

- More than one photo per report (the array allows it later; capped at 1 now).
- Editing or removing a photo after submit.
- Cleaning up orphaned uploads (picked, uploaded, then submit failed). Logged as a follow-up:
  a daily cron that deletes `_storage` rows older than 24h that no report references.
- Moderation of photo content beyond the existing US-13 flag (`privacy`/`abusive` reasons).
- Full-screen photo viewer. A thumbnail is enough for this ticket.

## Decisions

| Decision        | Choice                                                                                                          | Why                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where in wizard | Inside step 3 (`NotesStep`), below the summary                                                                  | Keeps `REPORT_STEPS` at four, so `StepIndicator`, step announcements and `report-draft.test.ts` don't change. Step 3 is already the "optional extras" step.         |
| When to upload  | At final submit, not at pick time                                                                               | Preserves "nothing is written until submit". Backing out of the wizard leaves no orphaned file. One failure path.                                                   |
| Submit sequence | `generateUploadUrl` → `fetch(POST)` → `submitReport({ ..., evidence })`                                         | Standard Convex upload flow. If the upload fails, `submitReport` is never called.                                                                                   |
| Compression     | `expo-image-manipulator`: resize longest edge to 1600px, re-encode JPEG at 0.7                                  | Phone photos are 3–12 MB; this lands them at ~200–600 KB. Re-encoding also turns HEIC (iOS default) into JPEG, so the MIME allowlist can stay small.                |
| Alt text        | Reuse the existing `caption` field as alt text; **required** when a photo is attached                           | No schema migration. Prefilled with "Photo of the entrance at {place}" style default the user can edit, so it's never empty. Server rejects blank/missing caption.  |
| Validation      | Client **and** server                                                                                           | Client gives instant feedback. Server is the real guard: Convex functions are public, so a client can skip the checks. Server reads `ctx.db.system.get(storageId)`. |
| Limits location | `MAX_PHOTO_BYTES`, `ALLOWED_PHOTO_MIME_TYPES`, `MAX_EVIDENCE_PHOTOS`, `MAX_CAPTION_LENGTH` in `reportLimits.ts` | Same reason the existing limits live there: one copy shared by the mutation and the UI.                                                                             |
| Thumbnail URL   | `listForPlace` resolves `ctx.storage.getUrl()` and returns `photos: { url, caption }[]`                         | The client never sees storage IDs and doesn't need a second query per card.                                                                                         |

Limits: `MAX_PHOTO_BYTES = 5 * 1024 * 1024`, `ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]`,
`MAX_EVIDENCE_PHOTOS = 1`, `MAX_CAPTION_LENGTH = 280` (reuse `MAX_NOTE_LENGTH` value).

---

## Backend

### `packages/backend/convex/reportLimits.ts`

Add the four constants above. Still no imports, no I/O.

### `packages/backend/convex/reports.ts`

**New `generateUploadUrl` mutation.** No args. Throws
`"Unauthenticated: must be logged in to upload a photo"` if `getAuthUserId` is null, otherwise
returns `await ctx.storage.generateUploadUrl()`. Auth-gated so the deployment URL isn't an open
file host.

**Extend `submitReport`.** New arg
`evidence: v.optional(v.array(v.object({ storageId: v.id("_storage"), caption: v.string() })))`.
Optional so existing callers and tests still pass. New guards, after the existing ones and before
the duplicate check (exact strings, matched by `report-errors.ts`):

1. `evidence.length > MAX_EVIDENCE_PHOTOS` → `` `Too many photos: maximum ${MAX_EVIDENCE_PHOTOS}` ``
2. `caption.trim() === ""` → `"Photo description is required"`
3. `caption.length > MAX_CAPTION_LENGTH` → `` `Photo description too long: ...` ``
4. `ctx.db.system.get(storageId)` is null → `"Unknown photo upload"`
5. `meta.size > MAX_PHOTO_BYTES` → `` `Photo too large: ${meta.size} bytes, maximum ${MAX_PHOTO_BYTES}` ``
6. `meta.contentType` not in allowlist → `` `Unsupported photo type: ${meta.contentType}` ``
7. `storageId` already referenced by another report → `"Photo already attached to another report"`
   (stops reusing someone else's upload). `evidence` is an array, which Convex cannot index, so
   this scans the whole `reports` table; it runs last and only when a photo is attached. A
   `by_place` scan would miss reuse across places. The fix when it stops scaling is an
   `evidence` table with a `by_storage` index.

Rejected files are **not** deleted: a mutation is one transaction, so a `ctx.storage.delete`
followed by the throw would be rolled back. They fall under the orphan-cleanup follow-up. Insert writes `evidence: args.evidence?.map(e => ({ storageId, caption: e.caption.trim() })) ?? []`.

**Extend `listForPlace`.** For each active report, map `evidence` to
`{ url: await ctx.storage.getUrl(e.storageId), caption: e.caption ?? "" }`, drop entries whose
`url` is null (file deleted). Return as `photos`. `storageId` is not returned.

### `packages/backend/convex/testing/reports.test.ts`

`convex-test` supports `ctx.storage.store(new Blob(...))` inside `t.run`, so all of these are real:

- `generateUploadUrl` rejects unauthenticated, returns a string when authed.
- Report with a valid JPEG blob persists `evidence` with trimmed caption.
- Report without `evidence` still works (photo optional) and stores `[]`.
- Rejects: >1 photo, blank caption, too-long caption, unknown storageId, oversize blob (5 MB + 1),
  wrong type (`text/plain` blob), storageId already used by another report.
- Upload that carried no content type is rejected.
- `listForPlace` returns `photos[0].url` non-null and the caption, and no `storageId`.

## Mobile

### Dependencies & config

- `bunx expo install expo-image-picker expo-image-manipulator` (in `apps/mobile`).
- `app.config.ts` plugin entry:
  ```ts
  [
    "expo-image-picker",
    {
      photosPermission:
        "Wayble uses your photos so you can attach evidence to an accessibility report.",
      cameraPermission:
        "Wayble uses your camera so you can photograph a place's accessibility features.",
    },
  ];
  ```
- Native module + permissions change → **rebuild the dev client** (`expo run:android`, `expo run:ios`
  or a new EAS internal build). Expo Go won't pick up the permission strings.

### Files

| File                                          | Change                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/report/photo-validation.ts`       | New, pure. `validatePhoto({ fileSize, mimeType })` → `{ ok: true } \| { ok: false, kind: "tooLarge" \| "unsupportedType" }`, using the shared limits. `defaultCaption(placeName)`.                                                                                                                                                           |
| `components/report/photo-validation.test.ts`  | New. Boundaries: exactly 5 MB passes, 5 MB + 1 fails, each allowed type, HEIC/GIF/undefined rejected.                                                                                                                                                                                                                                        |
| `components/report/report-draft.ts`           | Add `photo: { uri, mimeType, fileSize, caption } \| null` to `ReportDraft` + actions `setPhoto`, `setPhotoCaption`, `removePhoto`. `reset` clears it. `canAdvance` step 2 stays `true` unless a photo exists with a blank caption.                                                                                                           |
| `components/report/report-draft.test.ts`      | Cases for the three actions, reset, and the step-2 caption gate.                                                                                                                                                                                                                                                                             |
| `hooks/use-photo-picker.ts`                   | New. `takePhoto()` / `chooseFromLibrary()`: request permission, launch picker (`mediaTypes: ["images"]`, `quality: 1`, no editing), compress with manipulator, read size via `fetch(uri).blob().size`, run `validatePhoto`. Returns the asset or a typed error. Handles cancel and permission-denied.                                        |
| `components/report/PhotoEvidencePicker.tsx`   | New, presentational. No photo: two buttons "Take photo" / "Choose from library". With photo: thumbnail (`expo-image`), caption `TextInput` labelled "Describe the photo", "Remove photo" button. Inline error text for validation/permission failures.                                                                                       |
| `components/report/NotesStep.tsx`             | Render `PhotoEvidencePicker` under the summary; header copy becomes "Anything to add?" / "An optional sentence and photo…".                                                                                                                                                                                                                  |
| `components/report/ConfirmStep.tsx`           | Show thumbnail + caption in the recap when a photo is attached.                                                                                                                                                                                                                                                                              |
| `app/report/[placeId].tsx`                    | `handleSubmit`: if `draft.photo`, call `generateUploadUrl`, `fetch(url, { method: "POST", headers: { "Content-Type": mimeType }, body: blob })`, read `{ storageId }`, then `submitReport({ ..., evidence: [{ storageId, caption }] })`. Upload failure → `uploadFailed` banner, no submit. Button label "Uploading photo…" while in flight. |
| `components/report/report-errors.ts` (+ test) | New kinds: `photoTooLarge`, `photoType`, `photoCaption`, `uploadFailed`, matched on the server strings above.                                                                                                                                                                                                                                |
| `components/place/ReportCard.tsx`             | Add `photos: { url: string; caption: string }[]` to `PlaceReport`. Render thumbnail (e.g. 120×90, `contentFit="cover"`) with `accessible`, `accessibilityRole="image"`, `accessibilityLabel={caption}`.                                                                                                                                      |

### Accessibility

- Every thumbnail (picker, confirm, report card) has `accessibilityRole="image"` and
  `accessibilityLabel` = the caption. Never rendered without one.
- Caption field: visible label + `accessibilityLabelledBy`, 16pt font, `maxLength={MAX_CAPTION_LENGTH}`,
  hint explains it's read aloud to screen reader users.
- Buttons ≥44×44dp via `TouchTarget`.
- Announce "Photo added", "Photo removed", and validation errors via `announceForAccessibility`;
  error text uses `accessibilityRole="alert"`.
- Permission denied: plain message plus "Open settings" (`Linking.openSettings()`), not a dead end.

### Error copy

| Kind            | Message                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| tooLarge        | "That photo is over 5 MB. Try a different one."                             |
| unsupportedType | "That file type isn't supported. Use a JPEG, PNG or WebP photo."            |
| photoCaption    | "Add a short description of the photo."                                     |
| uploadFailed    | "We couldn't upload your photo. Check your connection and try again."       |
| permission      | "Wayble doesn't have permission to use your camera/photos." + Open settings |

---

## Task mapping

| ClickUp task                                                     | Covered by                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Integrate expo-image-picker (capture + library) with compression | `use-photo-picker.ts`, `PhotoEvidencePicker.tsx`, `app.config.ts`          |
| Call generateUploadUrl, upload, store storageId on report        | `reports.generateUploadUrl`, `submitReport` `evidence` arg, `handleSubmit` |
| Thumbnail via `ctx.storage.getUrl()` with accessibilityLabel     | `listForPlace` `photos`, `ReportCard`, `ConfirmStep`                       |
| Size (5 MB) + MIME validation before upload                      | `photo-validation.ts` (client) + `submitReport` guards (server)            |
| Photo optional                                                   | `evidence` optional arg, `canAdvance` unchanged without photo, tests       |
| Test on iOS simulator + Android emulator                         | Manual checklist below                                                     |

## Build order

1. Limits + `generateUploadUrl` + `submitReport` evidence guards + backend tests (green).
2. `listForPlace` photos + test.
3. Install deps, config plugin, rebuild dev clients.
4. `photo-validation.ts` + `report-draft.ts` changes with Vitest.
5. `use-photo-picker.ts` + `PhotoEvidencePicker` in `NotesStep`, recap in `ConfirmStep`.
6. Upload sequence in `handleSubmit` + error kinds.
7. `ReportCard` thumbnail.
8. Manual pass on both platforms, then traceability row in `docs/traceability.md`.

## Manual test checklist

iOS simulator has **no camera**: test "Choose from library" by dragging images into the simulator
(Photos app). Test "Take photo" on a physical iPhone if one is available, otherwise note it as
untested. Android emulator has a virtual camera scene, so both paths work there.

- [ ] Submit with no photo → succeeds, report card shows no thumbnail.
- [ ] Library pick (JPEG) → thumbnail in step 3, default caption present, confirm recap shows it, submit, card shows thumbnail.
- [ ] Library pick of an iOS HEIC photo → compressed to JPEG, uploads fine.
- [ ] Camera capture (Android emulator) → same as above.
- [ ] Clear the caption → Next is disabled / error shown.
- [ ] Remove photo → back to the two buttons; submit sends no evidence.
- [ ] Deny camera permission → message + Open settings works.
- [ ] Cancel the picker → nothing changes, no error.
- [ ] Airplane mode at submit → `uploadFailed` banner, no report created, draft intact.
- [ ] VoiceOver / TalkBack: thumbnail reads its caption; buttons and caption field labelled; announcements fire.
- [ ] Convex dashboard: file present in Storage, `reports.evidence[0].storageId` matches.

## Risks

- **Orphaned files** if the upload succeeds but `submitReport` throws (e.g. duplicate guard).
  The client can't know about the duplicate guard ahead of time, so for now accept the orphan and
  file the cleanup cron as a follow-up. If there's time, a small `deleteUpload` mutation called from
  the submit `catch` would clean up most cases cheaply.
- **Native rebuild needed**: anyone on an old dev client will crash on `expo-image-picker` import.
  Call it out in the PR description.

## As built

Where the implementation (the US-09 commits on
`feature/s3-2-attach-a-photo-as-evidence-US-09`) departs from the plan above, and why.

- **Rejected files are not deleted** (also corrected inline above). The plan had
  `ctx.storage.delete` before throwing; inside one mutation transaction that delete is rolled
  back with the throw.
- **Library picks need no permission.** `launchImageLibraryAsync` opens the system photo picker
  (PHPicker on iOS 14+, the Android photo picker), which runs out of process. Only the camera
  calls `requestCameraPermissionsAsync`. `photosPermission` stays in the config for the iOS
  plist.
- **`microphonePermission: false`** in the plugin config. Left unset, `expo-image-picker` adds
  `RECORD_AUDIO` for video capture, which this app never does.
- **`validatePhoto` has a third error, `empty`** (zero or unreadable size). The server would
  store a zero-byte file and nothing could render it.
- **`resizeFor()` skips the resize when dimensions are unknown** (0, which some Android
  providers report) instead of guessing a cap that could upscale a small photo. The JPEG
  re-encode still runs.
- **Default caption is "Photo taken at {place}"**, clamped to `MAX_CAPTION_LENGTH`. The place is
  the only thing known about the photo.
- **`PhotoEvidencePicker` owns the picker hook and its error state** rather than being purely
  presentational. A failed pick does not outlive step 3, so it belongs in neither the draft nor
  the wizard's submit banner. The photo itself still goes through `dispatch`.
- **The upload is its own module, `components/report/upload-photo.ts`,** with `fetch`
  injectable, so network, non-2xx, non-JSON and missing-`storageId` failures are covered by
  Vitest. `generateUploadUrl` errors pass through unwrapped and classify as `unauthenticated`.
- **Error kinds are `photoCaption`, `photoRejected`, `uploadFailed`**, not
  `photoTooLarge`/`photoType`. Every stored-file refusal shares `photoRejected` because the remedy
  is the same (use a different photo), and size/type are already checked on the device.
- **Upload is announced** ("Uploading photo."), because the submit button's
  `accessibilityLabel` does not change with its visible "Uploading photo…" text.
- **`listForPlace` labels a captionless legacy photo** "Photo attached to this report", so no
  thumbnail is ever rendered without alt text.
- **`convex-test` does not record `contentType`** on stored blobs. The backend test helper
  patches it onto the `_storage` row to match what production writes from the upload header.
