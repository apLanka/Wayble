import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  actingAs,
  createPlace,
  seedUser,
  setup,
  type E2E,
} from "../../test-utils/e2e-helpers";

/** S4-7b — remove report, moderator notes, resolved-flag history. */

async function seedModerator(t: E2E, email = "mod@example.com") {
  const id = await seedUser(t, email);
  await t.run((ctx) => ctx.db.patch(id, { role: "moderator" }));
  return id;
}

async function seedReport(t: E2E, authorId: Id<"users">, name = "Library") {
  const placeId = await createPlace(t, authorId, { name });
  return await t.run((ctx) =>
    ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      summary: "Elevator works",
      evidence: [],
      observedAt: 1,
      status: "active",
      updatedAt: 1,
    }),
  );
}

async function seedFlag(
  t: E2E,
  reportId: Id<"reports">,
  authorId: Id<"users">,
  reason: "spam" | "abusive" = "spam",
) {
  return await t.run((ctx) =>
    ctx.db.insert("flags", {
      reportId,
      authorId,
      reason,
      status: "open",
      updatedAt: 1,
    }),
  );
}

describe("moderation.removeReport", () => {
  test("rejects unauthenticated callers and members, changing nothing", async () => {
    const t = setup();
    const member = await seedUser(t, "member@example.com");
    const author = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, member);

    await expect(
      t.mutation(api.moderation.removeReport, { reportId }),
    ).rejects.toThrow("Unauthenticated");
    await expect(
      actingAs(t, member).mutation(api.moderation.removeReport, { reportId }),
    ).rejects.toThrow("Forbidden");
    expect((await t.run((ctx) => ctx.db.get(reportId)))?.status).toBe("active");
  });

  test("removes the report, resolves its open flags and stores a trimmed note", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const b = await seedUser(t, "b@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, a);
    await seedFlag(t, reportId, b, "abusive");
    const asMod = actingAs(t, mod);

    expect(
      await asMod.mutation(api.moderation.removeReport, {
        reportId,
        note: "  Clearly spam  ",
      }),
    ).toBe(2);

    expect((await t.run((ctx) => ctx.db.get(reportId)))?.status).toBe(
      "removed",
    );
    const flags = await t.run((ctx) => ctx.db.query("flags").collect());
    expect(flags).toHaveLength(2);
    for (const flag of flags) {
      expect(flag.status).toBe("resolved");
      expect(flag.resolvedBy).toBe(mod);
      expect(flag.resolutionNote).toBe("Clearly spam");
    }
    expect(await asMod.query(api.moderation.getFlaggedReports, {})).toEqual([]);
  });

  test("a blank note is stored as no note", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, a);

    await actingAs(t, mod).mutation(api.moderation.removeReport, {
      reportId,
      note: "   ",
    });

    const [flag] = await t.run((ctx) => ctx.db.query("flags").collect());
    expect(flag?.resolutionNote).toBeUndefined();
  });

  test("rejects an over-long note and changes nothing", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, a);

    await expect(
      actingAs(t, mod).mutation(api.moderation.removeReport, {
        reportId,
        note: "x".repeat(281),
      }),
    ).rejects.toThrow("Note too long");
    expect((await t.run((ctx) => ctx.db.get(reportId)))?.status).toBe("active");
  });

  test("rejects no open flags, an unknown report and a second removal", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const asMod = actingAs(t, mod);

    const unflagged = await seedReport(t, author, "A");
    await expect(
      asMod.mutation(api.moderation.removeReport, { reportId: unflagged }),
    ).rejects.toThrow("No open flags on this report");

    const gone = await seedReport(t, author, "B");
    await t.run((ctx) => ctx.db.delete(gone));
    await expect(
      asMod.mutation(api.moderation.removeReport, { reportId: gone }),
    ).rejects.toThrow("Unknown report");

    const flagged = await seedReport(t, author, "C");
    await seedFlag(t, flagged, a);
    await asMod.mutation(api.moderation.removeReport, { reportId: flagged });
    await seedFlag(t, flagged, author);
    await expect(
      asMod.mutation(api.moderation.removeReport, { reportId: flagged }),
    ).rejects.toThrow("Report already removed");
  });
});

describe("moderation.dismissFlag note", () => {
  test("stores the note on every dismissed flag", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, a);

    await actingAs(t, mod).mutation(api.moderation.dismissFlag, {
      reportId,
      note: "Looks fine",
    });

    const [flag] = await t.run((ctx) => ctx.db.query("flags").collect());
    expect(flag?.status).toBe("dismissed");
    expect(flag?.resolutionNote).toBe("Looks fine");
  });
});

describe("moderation.getResolvedFlags", () => {
  test("is moderator-only", async () => {
    const t = setup();
    const member = await seedUser(t, "member@example.com");
    await expect(t.query(api.moderation.getResolvedFlags, {})).rejects.toThrow(
      "Unauthenticated",
    );
    await expect(
      actingAs(t, member).query(api.moderation.getResolvedFlags, {}),
    ).rejects.toThrow("Forbidden");
  });

  test("lists removals and dismissals newest first, one entry per decision", async () => {
    const t = setup();
    const mod = await seedModerator(t);
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const b = await seedUser(t, "b@example.com");
    const asMod = actingAs(t, mod);

    const dismissed = await seedReport(t, author, "Dismissed Cafe");
    await seedFlag(t, dismissed, a);
    await seedFlag(t, dismissed, b, "abusive");
    await asMod.mutation(api.moderation.dismissFlag, {
      reportId: dismissed,
      note: "Fine",
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    const removed = await seedReport(t, author, "Removed Cafe");
    await seedFlag(t, removed, a);
    await asMod.mutation(api.moderation.removeReport, {
      reportId: removed,
      note: "Spam",
    });

    // Still open: must not appear in history.
    const open = await seedReport(t, author, "Open Cafe");
    await seedFlag(t, open, a);

    const history = await asMod.query(api.moderation.getResolvedFlags, {});
    expect(history.map((h) => h.placeName)).toEqual([
      "Removed Cafe",
      "Dismissed Cafe",
    ]);
    expect(history[0]).toMatchObject({
      outcome: "removed",
      flagCount: 1,
      resolutionNote: "Spam",
      resolvedByName: "mod@example.com",
    });
    expect(history[1]).toMatchObject({
      outcome: "dismissed",
      flagCount: 2,
      reasons: expect.arrayContaining(["spam", "abusive"]),
      resolutionNote: "Fine",
    });
  });
});
