import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv, resolveConvexUrl, upsertEnvLine } from "./lib/env-file";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const backendEnvPath = join(root, "packages/backend/.env.local");
const mobileEnvPath = join(root, "apps/mobile/.env.local");

function fail(message: string): never {
  console.error(`\n[sync-convex-env] ${message}\n`);
  process.exit(1);
}

if (!existsSync(backendEnvPath)) {
  fail(
    "packages/backend/.env.local not found.\n" +
      "Provision your Convex dev deployment first:\n" +
      "  bun run --filter @packages/backend setup",
  );
}

const backendEnv = parseEnv(readFileSync(backendEnvPath, "utf8"));
const resolved = resolveConvexUrl(backendEnv);

if (!resolved) {
  fail(
    "CONVEX_URL is missing from packages/backend/.env.local.\n" +
      "Re-run:  bun run --filter @packages/backend setup",
  );
}

const convexUrl = resolved.url;

if (resolved.source === "override") {
  console.log("[sync-convex-env] using CONVEX_URL_OVERRIDE");
}

const current = existsSync(mobileEnvPath)
  ? readFileSync(mobileEnvPath, "utf8")
  : "";
const next = upsertEnvLine(current, "EXPO_PUBLIC_CONVEX_URL", convexUrl);

if (next === current) {
  console.log("[sync-convex-env] already up to date");
} else {
  writeFileSync(mobileEnvPath, next);
  console.log(`[sync-convex-env] wrote EXPO_PUBLIC_CONVEX_URL=${convexUrl}`);
}
