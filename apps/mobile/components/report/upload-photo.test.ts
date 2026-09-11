import { describe, expect, test } from "vitest";
import { UPLOAD_FAILED_PREFIX, uploadPhoto } from "./upload-photo";

const photo = { uri: "file:///photo.jpg", mimeType: "image/jpeg" };
const UPLOAD_URL = "https://example.convex.cloud/api/storage/upload?token=t";

type Call = { input: string; init?: RequestInit };

/**
 * A fetch that serves the local file read, then answers the upload POST with
 * `upload`. Records every call so the request itself can be asserted on.
 */
function fakeFetch(upload: () => Promise<Response>) {
  const calls: Call[] = [];
  const impl = async (input: string, init?: RequestInit) => {
    calls.push({ input, init });
    if (input === photo.uri) return new Response(new Blob(["jpeg bytes"]));
    return upload();
  };
  return { impl, calls };
}

const getUploadUrl = async () => UPLOAD_URL;

describe("uploadPhoto", () => {
  test("POSTs the file with its content type and returns the storageId", async () => {
    const { impl, calls } = fakeFetch(async () =>
      Response.json({ storageId: "kg2abc" }),
    );

    await expect(uploadPhoto(photo, getUploadUrl, impl)).resolves.toBe(
      "kg2abc",
    );

    const post = calls.find((c) => c.input === UPLOAD_URL);
    expect(post?.init?.method).toBe("POST");
    expect(post?.init?.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(post?.init?.body).toBeInstanceOf(Blob);
  });

  test("lets a getUploadUrl failure through unwrapped", async () => {
    const { impl, calls } = fakeFetch(async () => Response.json({}));
    const signedOut = async () => {
      throw new Error("Unauthenticated: must be logged in to upload a photo");
    };

    await expect(uploadPhoto(photo, signedOut, impl)).rejects.toThrow(
      "Unauthenticated: must be logged in to upload a photo",
    );
    expect(calls).toHaveLength(0);
  });

  test("wraps a network failure", async () => {
    const { impl } = fakeFetch(async () => {
      throw new TypeError("Network request failed");
    });

    await expect(uploadPhoto(photo, getUploadUrl, impl)).rejects.toThrow(
      `${UPLOAD_FAILED_PREFIX} network error`,
    );
  });

  test("wraps a non-2xx response with its status", async () => {
    const { impl } = fakeFetch(
      async () => new Response("nope", { status: 413 }),
    );

    await expect(uploadPhoto(photo, getUploadUrl, impl)).rejects.toThrow(
      `${UPLOAD_FAILED_PREFIX} HTTP 413`,
    );
  });

  test("wraps a response that is not JSON", async () => {
    const { impl } = fakeFetch(async () => new Response("<html>"));

    await expect(uploadPhoto(photo, getUploadUrl, impl)).rejects.toThrow(
      `${UPLOAD_FAILED_PREFIX} unreadable response`,
    );
  });

  test("wraps a response without a storageId", async () => {
    const { impl } = fakeFetch(async () => Response.json({ ok: true }));

    await expect(uploadPhoto(photo, getUploadUrl, impl)).rejects.toThrow(
      `${UPLOAD_FAILED_PREFIX} no storageId in response`,
    );
  });
});
