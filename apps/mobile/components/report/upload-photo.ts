import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ReportPhoto } from "./report-draft";

/**
 * Prefix on every error this module throws itself, so `report-errors.ts` can
 * tell a failed upload from a failed `submitReport`.
 */
export const UPLOAD_FAILED_PREFIX = "Photo upload failed:";

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * US-09 — send the draft's photo to Convex storage and return its storageId.
 *
 * The standard three-step Convex upload: ask the backend for a one-time URL,
 * POST the bytes to it, read `{ storageId }` back. Runs at submit, before
 * `submitReport`, so a failure here means no report is written at all.
 *
 * The Content-Type header is not decoration: Convex records it as the file's
 * `contentType`, and `submitReport` rejects a file without an allowed one.
 *
 * `getUploadUrl` errors (e.g. signed out) are let through untouched so they
 * classify as what they are; only the transfer itself is wrapped. `fetch` is a
 * parameter so the error paths can be tested without a network.
 */
export async function uploadPhoto(
  photo: Pick<ReportPhoto, "uri" | "mimeType">,
  getUploadUrl: () => Promise<string>,
  fetchImpl: Fetch = fetch,
): Promise<Id<"_storage">> {
  const uploadUrl = await getUploadUrl();

  let response: Response;
  try {
    const file = await (await fetchImpl(photo.uri)).blob();
    response = await fetchImpl(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": photo.mimeType },
      body: file,
    });
  } catch {
    throw new Error(`${UPLOAD_FAILED_PREFIX} network error`);
  }

  if (!response.ok) {
    throw new Error(`${UPLOAD_FAILED_PREFIX} HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${UPLOAD_FAILED_PREFIX} unreadable response`);
  }
  const storageId = (body as { storageId?: unknown } | null)?.storageId;
  if (typeof storageId !== "string" || storageId.length === 0) {
    throw new Error(`${UPLOAD_FAILED_PREFIX} no storageId in response`);
  }
  return storageId as Id<"_storage">;
}
