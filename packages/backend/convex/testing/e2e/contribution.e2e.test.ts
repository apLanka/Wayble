import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { actingAs, createPlace, seedUser, setup, stepFree } from "./helpers";

describe("Flow 3 — Contribution", () => {
  test("submit report > duplicate guard fires within 24h > photo upload completes", async () => {
    const t = setup();
    const userId = await seedUser(t, "contributor@example.com");
    const asUser = actingAs(t, userId);
    const placeId = await createPlace(t, userId);

    // Submit.
    const report = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [stepFree],
      summary: "Ramp at the side entrance.",
      observedAt: Date.now(),
    });
    expect(report?.authorId).toBe(userId);
    expect(report?.status).toBe("active");

    const place = await asUser.query(api.places.getPlace, { placeId });
    expect(place?.reportCount).toBe(1);
    const listed = await asUser.query(api.reports.listForPlace, { placeId });
    expect(listed).toHaveLength(1);

    // Second submission inside the 24h window is refused and writes nothing.
    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [{ key: stepFree.key, value: "no" }],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Duplicate report");
    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(1);

    // A different place is unaffected by the guard.
    const otherPlace = await createPlace(t, userId, { name: "Other" });
    await asUser.mutation(api.reports.submitReport, {
      placeId: otherPlace,
      attributes: [stepFree],
      observedAt: Date.now(),
    });

    // Photo upload: store the blob, attach it as evidence, read it back.
    // (No upload/attach endpoint exists yet; this checks storage + schema.)
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" })),
    );
    await t.run(async (ctx) => {
      await ctx.db.patch(report!._id, {
        evidence: [{ storageId, caption: "Side ramp" }],
      });
    });
    const stored = await t.run(async (ctx) => {
      const r = await ctx.db.get(report!._id);
      const first = r?.evidence[0];
      const blob = first ? await ctx.storage.get(first.storageId) : null;
      return { evidence: r?.evidence, size: blob?.size, type: blob?.type };
    });
    expect(stored.evidence).toHaveLength(1);
    expect(stored.evidence?.[0]?.storageId).toBe(storageId);
    expect(stored.size).toBe("fake-jpeg-bytes".length);
    expect(stored.type).toBe("image/jpeg");
  });

  test("the duplicate guard lifts once the 24h window has passed", async () => {
    const t = setup();
    const userId = await seedUser(t, "patient@example.com");
    const asUser = actingAs(t, userId);
    const placeId = await createPlace(t, userId);

    const first = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [stepFree],
      observedAt: Date.now(),
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(first!._id, {
        updatedAt: Date.now() - 25 * 60 * 60 * 1000,
      });
    });

    const second = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [stepFree],
      observedAt: Date.now(),
    });
    expect(second?._id).not.toBe(first?._id);
  });
});
