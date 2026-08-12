/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessibility from "../accessibility.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as notificationCopy from "../notificationCopy.js";
import type * as notificationPolicy from "../notificationPolicy.js";
import type * as notifications from "../notifications.js";
import type * as places from "../places.js";
import type * as pushTokens from "../pushTokens.js";
import type * as seed from "../seed.js";
import type * as seed_placesSeedData from "../seed/placesSeedData.js";
import type * as users from "../users.js";
import type * as verificationNeed from "../verificationNeed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessibility: typeof accessibility;
  auth: typeof auth;
  crons: typeof crons;
  health: typeof health;
  http: typeof http;
  notificationCopy: typeof notificationCopy;
  notificationPolicy: typeof notificationPolicy;
  notifications: typeof notifications;
  places: typeof places;
  pushTokens: typeof pushTokens;
  seed: typeof seed;
  "seed/placesSeedData": typeof seed_placesSeedData;
  users: typeof users;
  verificationNeed: typeof verificationNeed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  geospatial: import("@convex-dev/geospatial/_generated/component.js").ComponentApi<"geospatial">;
};
