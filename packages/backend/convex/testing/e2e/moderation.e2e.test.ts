import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  actingAs,
  createPlace,
  seedUser,
  setup,
  stepFree,
} from "../../../test-utils/e2e-helpers";

describe("Flow 5 — Moderation", () => {
  test("flag > moderator removes > report leaves the place and the queue > history records it", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const flaggerId = await seedUser(t, "flagger@example.com");
    const modId = await seedUser(t, "mod@example.com");
    await t.run((ctx) => ctx.db.patch(modId, { role: "moderator" }));
    const asAuthor = actingAs(t, authorId);
    const asFlagger = actingAs(t, flaggerId);
    const asMod = actingAs(t, modId);

    const placeId = await createPlace(t, authorId);
    const report = await asAuthor.mutation(api.reports.submitReport, {
      placeId,
      attributes: [stepFree],
      summary: "Buy cheap watches",
      observedAt: Date.now(),
    });
    const reportId = report!._id;
    expect(
      await asFlagger.query(api.reports.listForPlace, { placeId }),
    ).toHaveLength(1);

    await asFlagger.mutation(api.flags.flagReport, {
      reportId,
      reason: "spam",
    });
    const queue = await asMod.query(api.moderation.getFlaggedReports, {});
    expect(queue.map((q) => q.reportId)).toEqual([reportId]);

    await asMod.mutation(api.moderation.removeReport, {
      reportId,
      note: "Spam",
    });

    // Gone from the place and from the queue.
    expect(
      await asFlagger.query(api.reports.listForPlace, { placeId }),
    ).toEqual([]);
    expect(await asMod.query(api.moderation.getFlaggedReports, {})).toEqual([]);
    const place = await asFlagger.query(api.places.getPlace, { placeId });
    expect(place?.reportCount).toBe(0);

    // And recorded.
    const history = await asMod.query(api.moderation.getResolvedFlags, {});
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      outcome: "removed",
      resolutionNote: "Spam",
    });
  });
});
