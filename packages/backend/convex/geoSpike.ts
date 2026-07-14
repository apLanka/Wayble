import { GeospatialIndex, point } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// ponytail: string keys, no backing table — validates the component only.
// US-03 will key off Id<"places"> once the real index/filter design lands.
export const geo = new GeospatialIndex<string, { category: string }>(
  components.geospatial,
);

const SEED_POINTS = [
  // Malabe & surrounds
  { name: "SLIIT Campus", category: "education", lat: 6.9147, lng: 79.9723 },
  {
    name: "Malabe Hospital",
    category: "healthcare",
    lat: 6.9012,
    lng: 79.9698,
  },
  { name: "Malabe Town Center", category: "other", lat: 6.9035, lng: 79.9743 },
  { name: "Horizon Campus", category: "education", lat: 6.915, lng: 79.974 },
  { name: "CINEC Campus", category: "education", lat: 6.9198, lng: 79.9654 },
  // Colombo
  {
    name: "Colombo National Hospital",
    category: "healthcare",
    lat: 6.9271,
    lng: 79.8612,
  },
  { name: "Majestic City", category: "retail", lat: 6.8942, lng: 79.8529 },
  { name: "Galle Face Green", category: "outdoor", lat: 6.9119, lng: 79.8478 },
  {
    name: "Colombo Fort Railway Station",
    category: "transport",
    lat: 6.9345,
    lng: 79.8507,
  },
  {
    name: "Viharamahadevi Park",
    category: "outdoor",
    lat: 6.9154,
    lng: 79.8626,
  },
  {
    name: "One Galle Face Mall",
    category: "retail",
    lat: 6.9105,
    lng: 79.8462,
  },
  {
    name: "Colombo City Centre",
    category: "retail",
    lat: 6.9168,
    lng: 79.8548,
  },
  // Sri Jayawardenepura Kotte / suburbs
  {
    name: "Parliament of Sri Lanka",
    category: "government",
    lat: 6.8929,
    lng: 79.9023,
  },
  { name: "Diyatha Uyana", category: "outdoor", lat: 6.8998, lng: 79.9065 },
  { name: "Nugegoda Market", category: "retail", lat: 6.8701, lng: 79.8894 },
  { name: "Nawala Junction", category: "transport", lat: 6.8923, lng: 79.9011 },
  { name: "Rajagiriya", category: "food_and_drink", lat: 6.9091, lng: 79.9045 },
  // Kaduwela / Athurugiriya area near Malabe
  {
    name: "Kaduwela Divisional Secretariat",
    category: "government",
    lat: 6.9337,
    lng: 79.9881,
  },
  { name: "Athurugiriya Town", category: "other", lat: 6.8734, lng: 79.9893 },
  {
    name: "Nevill Fernando Teaching Hospital",
    category: "healthcare",
    lat: 6.9189,
    lng: 79.9575,
  },
  // Mt Lavinia / Dehiwala
  { name: "Mt Lavinia Beach", category: "outdoor", lat: 6.8389, lng: 79.8676 },
  { name: "Dehiwala Zoo", category: "outdoor", lat: 6.8569, lng: 79.8648 },
] as const;

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const p of SEED_POINTS) {
      await geo.insert(
        ctx,
        `spike:${p.name}`,
        { latitude: p.lat, longitude: p.lng },
        { category: p.category },
      );
    }
    return { inserted: SEED_POINTS.length };
  },
});

export const nearest = query({
  args: { point, limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await geo.nearest(ctx, {
      point: args.point,
      limit: args.limit ?? 5,
    });
  },
});
