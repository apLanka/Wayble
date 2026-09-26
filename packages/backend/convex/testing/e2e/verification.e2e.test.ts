import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  actingAs,
  createPlace,
  seedUser,
  setup,
  stepFree,
} from "../../../test-utils/e2e-helpers";

describe("Flow 4 — Verification", () => {
  test("confirm > tally updates > self-verification rejected > vote is changeable", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const voterId = await seedUser(t, "voter@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const asAuthor = actingAs(t, authorId);
    const asVoter = actingAs(t, voterId);
    const asOther = actingAs(t, otherId);

    const placeId = await createPlace(t, authorId);
    const report = await asAuthor.mutation(api.reports.submitReport, {
      placeId,
      attributes: [stepFree],
      observedAt: Date.now(),
    });
    const reportId = report!._id;

    // Nobody has voted yet.
    expect(
      await asVoter.query(api.verifications.forReport, { reportId }),
    ).toEqual({
      confirmCount: 0,
      disputeCount: 0,
      totalVotes: 0,
      myVerdict: null,
    });

    // Confirm; the tally updates and reflects the caller's own verdict.
    await asVoter.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    expect(
      await asVoter.query(api.verifications.forReport, { reportId }),
    ).toEqual({
      confirmCount: 1,
      disputeCount: 0,
      totalVotes: 1,
      myVerdict: "confirm",
    });
    // Another viewer sees the count but not someone else's verdict.
    const seenByOther = await asOther.query(api.verifications.forReport, {
      reportId,
    });
    expect(seenByOther.confirmCount).toBe(1);
    expect(seenByOther.myVerdict).toBeNull();

    // Self-verification is rejected server-side and changes nothing.
    await expect(
      asAuthor.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Cannot verify your own report");
    expect(
      (await asAuthor.query(api.verifications.forReport, { reportId }))
        .totalVotes,
    ).toBe(1);

    // Vote is changeable: still one row, the tally moves confirm -> dispute.
    await asVoter.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
      note: "The ramp is blocked.",
    });
    expect(
      await asVoter.query(api.verifications.forReport, { reportId }),
    ).toEqual({
      confirmCount: 0,
      disputeCount: 1,
      totalVotes: 1,
      myVerdict: "dispute",
    });
    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(1);

    // A second voter adds to the tally rather than replacing the first.
    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    const final = await asOther.query(api.verifications.forReport, {
      reportId,
    });
    expect(final).toMatchObject({
      confirmCount: 1,
      disputeCount: 1,
      totalVotes: 2,
    });
  });

  test("unauthenticated callers cannot vote", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const placeId = await createPlace(t, authorId);
    const report = await actingAs(t, authorId).mutation(
      api.reports.submitReport,
      { placeId, attributes: [stepFree], observedAt: Date.now() },
    );
    await expect(
      t.mutation(api.verifications.verifyReport, {
        reportId: report!._id,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Unauthenticated");
  });
});
