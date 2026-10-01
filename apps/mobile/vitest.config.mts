import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The mobile test runner has to agree with `tsconfig.json` on where `@/`
 * points, or every tested module that imports a screen, component or constant
 * has to fall back to a relative path the rest of the app does not use. The
 * alias is declared in tsconfig.json; without this file Vitest ignores it and
 * fails with "Cannot find package '@/...'".
 *
 * `fileURLToPath` rather than `__dirname` so the path is correct regardless of
 * the module system Vitest loads this config under.
 */
const appRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": appRoot,
    },
  },
});
