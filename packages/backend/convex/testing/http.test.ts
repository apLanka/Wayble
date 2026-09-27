import { describe, expect, test } from "vitest";
import http from "../http";

describe("http routing", () => {
  test("httpRouter is defined and exported as default", () => {
    expect(http).toBeDefined();
  });

  test("httpRouter has exact and prefix route methods", () => {
    expect(http.exactRoutes).toBeDefined();
    expect(http.prefixRoutes).toBeDefined();
  });
});
