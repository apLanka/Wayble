import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.*s");

export function setup() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

export type E2E = ReturnType<typeof setup>;

export async function seedUser(t: E2E, email: string) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email,
      displayName: email,
      role: "member",
      updatedAt: 1,
    }),
  );
}

/** A client acting as `userId`, the way the Convex auth identity resolves. */
export function actingAs(t: E2E, userId: Id<"users">, sessionId?: string) {
  return t.withIdentity({
    subject: sessionId ? `${userId}|${sessionId}` : userId,
  });
}

export async function createPlace(
  t: E2E,
  userId: Id<"users">,
  overrides: Partial<{
    name: string;
    latitude: number;
    longitude: number;
  }> = {},
) {
  return await actingAs(t, userId).mutation(api.places.create, {
    name: overrides.name ?? "Community Library",
    category: "education",
    address: "1 Main Street",
    location: {
      latitude: overrides.latitude ?? 6.9271,
      longitude: overrides.longitude ?? 79.8612,
    },
  });
}

export const stepFree = {
  key: "mobility.step_free_entrance" as const,
  value: "yes" as const,
};
