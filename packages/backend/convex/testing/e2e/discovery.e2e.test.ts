import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { actingAs, seedUser, setup } from "../../../test-utils/e2e-helpers";

describe("Flow 2 — Discovery", () => {
  test("nearbyPlaces returns results > marker data and list view show the same places", async () => {
    const t = setup();
    const userId = await seedUser(t, "explorer@example.com");
    const asUser = actingAs(t, userId);

    const seeds = [
      { name: "Far Cafe", latitude: 6.99, longitude: 79.9 },
      { name: "Near Library", latitude: 6.9272, longitude: 79.8613 },
      { name: "Mid Clinic", latitude: 6.93, longitude: 79.865 },
    ];
    for (const s of seeds) {
      await asUser.mutation(api.places.create, {
        name: s.name,
        category: "other",
        address: "1 Test St",
        location: { latitude: s.latitude, longitude: s.longitude },
        accessibilityCategories: ["wheelchair"],
      });
    }

    const here = { latitude: 6.9271, longitude: 79.8612 };
    const nearby = await asUser.query(api.places.nearest, {
      point: here,
      limit: 40,
      maxDistance: 50000,
    });

    expect(nearby).toHaveLength(3);
    expect(nearby[0]?.name).toBe("Near Library");
    const distances = nearby.map((p) => p.distance);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));

    // Map markers: the mapbox screen builds one GeoJSON point per place from
    // _id, location and accessibilityCategories — all must be present.
    const features = nearby.map((p) => ({
      id: p._id,
      coordinates: [p.location.longitude, p.location.latitude],
      hasWheelchair: p.accessibilityCategories?.includes("wheelchair"),
    }));
    for (const f of features) {
      expect(f.coordinates.every(Number.isFinite)).toBe(true);
      expect(f.hasWheelchair).toBe(true);
    }

    // List view: PlaceListItem reads name, category and distance per place,
    // from the same result set as the markers.
    const listRows = nearby.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      distance: p.distance,
    }));
    expect(listRows.map((r) => r.id)).toEqual(features.map((f) => f.id));
    for (const row of listRows) {
      expect(row.name).toBeTruthy();
      expect(row.category).toBe("other");
      expect(row.distance).toBeGreaterThanOrEqual(0);
    }

    // maxDistance narrows both views identically.
    const tight = await asUser.query(api.places.nearest, {
      point: here,
      maxDistance: 500,
    });
    expect(tight.map((p) => p.name)).toEqual(["Near Library"]);

    // Search (the other discovery entry point) finds the same document.
    const found = await asUser.query(api.places.search, { query: "Library" });
    expect(found.map((p) => p._id)).toEqual([nearby[0]?._id]);
  });

  test("returns an empty list, not an error, when nothing is nearby", async () => {
    const t = setup();
    const nearby = await t.query(api.places.nearest, {
      point: { latitude: 0, longitude: 0 },
      limit: 40,
    });
    expect(nearby).toEqual([]);
  });
});
