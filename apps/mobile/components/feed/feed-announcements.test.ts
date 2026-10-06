import { describe, expect, test } from "vitest";

import {
  announcementFor,
  attributeSummary,
  describeFeedItem,
  feedItemKey,
  findNewItems,
  type FeedEntry,
} from "./feed-announcements";

const entry = (over: Partial<FeedEntry> = {}): FeedEntry => ({
  _id: "v1",
  verifierId: "u1",
  verifierName: "Sam",
  placeName: "Community Library",
  verdict: "confirm",
  attributes: [{ key: "mobility.elevator" }],
  updatedAt: 100,
  ...over,
});

describe("feedItemKey", () => {
  test("changes when the same vote is edited", () => {
    expect(feedItemKey(entry())).not.toBe(
      feedItemKey(entry({ updatedAt: 200 })),
    );
  });
});

describe("findNewItems", () => {
  test("returns only unseen items, newest first", () => {
    const a = entry({ _id: "a", updatedAt: 1 });
    const b = entry({ _id: "b", updatedAt: 2 });
    const c = entry({ _id: "c", updatedAt: 3 });
    const seen = new Set([feedItemKey(a)]);
    expect(findNewItems(seen, [a, b, c], undefined).map((i) => i._id)).toEqual([
      "c",
      "b",
    ]);
  });

  test("ignores the current user's own votes", () => {
    const mine = entry({ _id: "m", verifierId: "me" });
    const theirs = entry({ _id: "t", verifierId: "other" });
    expect(
      findNewItems(new Set(), [mine, theirs], "me").map((i) => i._id),
    ).toEqual(["t"]);
  });

  test("treats an edited vote as new", () => {
    const before = entry();
    const after = entry({ verdict: "dispute", updatedAt: 500 });
    expect(
      findNewItems(new Set([feedItemKey(before)]), [after], undefined),
    ).toHaveLength(1);
  });
});

describe("attributeSummary", () => {
  test("single, many and empty", () => {
    expect(attributeSummary([{ key: "mobility.elevator" }])).toBe("Elevator");
    expect(
      attributeSummary([
        { key: "mobility.elevator" },
        { key: "mobility.wide_entrance" },
        { key: "vision.braille_signage" },
      ]),
    ).toBe("Elevator and 2 more");
    expect(attributeSummary([])).toBe("accessibility report");
  });
});

describe("describeFeedItem / announcementFor", () => {
  test("describes a confirm and a dispute", () => {
    expect(describeFeedItem(entry())).toBe(
      "Sam confirmed Elevator at Community Library",
    );
    expect(describeFeedItem(entry({ verdict: "dispute" }))).toBe(
      "Sam disputed Elevator at Community Library",
    );
  });

  test("null for none, singular for one, collapsed for many", () => {
    expect(announcementFor([])).toBeNull();
    expect(announcementFor([entry()])).toBe(
      "New verification nearby: Sam confirmed Elevator at Community Library.",
    );
    expect(announcementFor([entry(), entry({ _id: "v2" })])).toBe(
      "2 new verifications nearby. Latest: Sam confirmed Elevator at Community Library.",
    );
  });
});
