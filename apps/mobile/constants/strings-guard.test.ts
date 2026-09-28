/// <reference types="node" />
// `apps/mobile` compiles with `moduleResolution: "bundler"` and Expo's
// `react-native` condition, which does not resolve the `node:` builtins. The
// reference is what lets this one test read the source tree; nothing else in
// the app touches Node APIs, and nothing here ships.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The guard behind the EDI localisation claim.
 *
 * PRD §6 asks that all strings live in one module "so the claim is credible".
 * A one-time extraction cannot hold that claim: the first new screen after
 * Sprint 4 puts its copy back inline and the module quietly stops being the
 * whole story. This test is what turns the claim into a property of the
 * codebase rather than a claim about one commit.
 *
 * ## Why a ceiling and not an allowlist
 *
 * An allowlist of every string currently inline was the first design, and it
 * is the wrong one. A list of 311 literals is indistinguishable, to a
 * reviewer, from a guard that has been switched off — and it cannot shrink
 * honestly, because every entry looks equally justified.
 *
 * A committed ceiling is one number that can only go down. Each refactor task
 * moves copy out and lowers it by exactly what it moved; the diff reads as a
 * countdown ending at the residue. It cannot be gamed by deleting one string
 * and adding two, because the total is what is asserted. What it does *not*
 * do is say which file regressed on a given commit — the failure message
 * prints the per-file breakdown for that, and the code review covers it.
 *
 * ## What is deliberately not detected
 *
 * - Style values. Every `color: "#fff"` and `fontSize: 16` is a string
 *   literal and none of it is copy.
 * - `accessibilityRole` and SF Symbol names — platform tokens, not copy.
 * - A text node that interpolates (`{count} needs selected`) is not matched as
 *   a literal, because the interesting part is the surrounding words, which
 *   the AppText pattern picks up only when it is plain text. Interpolated copy
 *   is moved by the refactor tasks and pinned by `strings.test.ts` instead.
 * - `console.*` output, which is developer-facing by definition.
 *
 * The guard covers the accessibility-label surface, the placeholder and title
 * props, route titles, and plain-text `AppText` bodies. That is the copy a
 * screen reader or a sighted user receives without any interpolation.
 */

/** Where user-facing copy lives under apps/mobile. */
const SCAN_ROOTS = ["app", "components", "hooks", "utils"];

/**
 * Paths with no user-facing copy: dev-only screens, a fixture, and a hook
 * that returns a boolean. Everything else is scanned, including the map
 * components — they are live on `origin/main` even when a working tree has
 * temporarily dropped the map.
 */
const EXCLUDED = [
  "components/debug",
  "app/debug",
  "data/mock-data.ts",
  "hooks/use-screen-reader.ts",
];

/** Props whose values are copy a person or a screen reader receives. */
const COPY_PROPS = [
  "accessibilityLabel",
  "accessibilityHint",
  "accessibilityValue",
  "placeholder",
  "errorMessage",
  "actionLabel",
];

/**
 * Every pattern that recognises an inline copy literal.
 *
 * `Text` is never imported outside `components/ui/app-text.tsx`, so `AppText`
 * is the only text element in the app and one pattern covers all visible copy.
 */
function copyPatterns(): RegExp[] {
  const patterns: RegExp[] = [];
  for (const prop of COPY_PROPS) {
    patterns.push(new RegExp(`\\b${prop}="([^"]{2,})"`, "g"));
    // `prop={'literal'}` and `prop={`literal`}` — a constant in disguise.
    patterns.push(
      new RegExp(`\\b${prop}=\\{["'\`]([^"'\`]{2,})["'\`]\\}`, "g"),
    );
    // A destructuring default, e.g. `placeholder = "Search places..."`.
    patterns.push(new RegExp(`\\b${prop}\\s*=\\s*"([^"]{2,})"`, "g"));
  }
  patterns.push(/\btitle:\s*"([^"]{2,})"/g);
  patterns.push(/\bheaderBackTitle:\s*"([^"]{2,})"/g);
  patterns.push(/<NativeTabs\.Trigger\.Label>([^<{]{2,})</g);
  patterns.push(/<AppText\b[^>]*>\s*([^<>{}][^<>{}]*?)\s*<\/AppText>/g);
  return patterns;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
    const rel = relative(MOBILE_ROOT, full).split(sep).join("/");
    if (EXCLUDED.some((ex) => rel === ex || rel.startsWith(`${ex}/`))) continue;
    out.push(rel);
  }
  return out;
}

type Violation = { file: string; value: string };

function findInlineCopy(source: string, file: string): Violation[] {
  const found: Violation[] = [];
  for (const pattern of copyPatterns()) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      found.push({ file, value: match[1].replace(/\s+/g, " ").trim() });
    }
  }
  return found;
}

const MOBILE_ROOT = join(__dirname, "..");
const FILES = SCAN_ROOTS.flatMap((root) =>
  walk(join(MOBILE_ROOT, root)),
).sort();

/**
 * The committed ceiling on inline copy literals.
 *
 * Lower it by exactly the number a refactor task moves out, and say so in the
 * commit body. It is a floor that only falls:
 *
 *   311  guard written (Task 1)
 *   299  navigation titles, stack titles, tab labels (Task 2)
 *   237  sign-in, sign-up, onboarding (Task 3)
 *   204  home screen and its five components (Task 4)
 *   173  map tab, its eight components, the map place screen (Task 5)
 *   141  place detail, report list, verification control (Task 6)
 *   103  the four-step report wizard (Task 7)
 *    58  profile tab and the accessibility-needs editor (Task 8)
 *     9  settings tab and the notifications sub-screen (Task 9)
 *
 * Of the 9 that remain after Task 9, six are emoji used as icons and never
 * will be moved — the close "✕", the search "🔍", the clear "✕", the place
 * "📍", the clipboard "📋" and the checkbox "✓". The other three are in
 * apps/(tabs)/mapbox/index.tsx, which carries uncommitted work predating this
 * branch and is finished in a final commit. That takes the floor to 6.
 */
const INLINE_COPY_CEILING = 9;

describe("strings guard", () => {
  it("scans the whole copy surface, so a silently empty walk cannot pass", () => {
    // Without this every other assertion is vacuously true. A refactor that
    // broke the walker — a bad glob, a renamed directory — would look like
    // success.
    expect(FILES.length).toBeGreaterThan(60);
    expect(FILES).toContain("app/(tabs)/home/index.tsx");
    expect(FILES).toContain("components/report/ConfirmStep.tsx");
    expect(FILES).toContain("components/map/DetailSheet.tsx");
    expect(FILES).toContain("utils/get-time-greeting.ts");
  });

  it("keeps inline copy at or below the committed ceiling", () => {
    const violations = FILES.flatMap((file) =>
      findInlineCopy(readFileSync(join(MOBILE_ROOT, file), "utf8"), file),
    );

    if (violations.length > INLINE_COPY_CEILING) {
      const perFile = new Map<string, number>();
      for (const v of violations) {
        perFile.set(v.file, (perFile.get(v.file) ?? 0) + 1);
      }
      const breakdown = [...perFile.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([file, n]) => `  ${String(n).padStart(3)}  ${file}`)
        .join("\n");
      throw new Error(
        `${violations.length} inline copy literals, ceiling is ${INLINE_COPY_CEILING}.\n` +
          `Add it to constants/strings.ts. Do not raise the ceiling.\n\n${breakdown}`,
      );
    }

    expect(violations.length).toBeLessThanOrEqual(INLINE_COPY_CEILING);
  });

  it("keeps strings.ts free of runtime imports", () => {
    // `app.config.ts` reads the location permission prompt from strings.ts,
    // and Expo evaluates that config in Node — no `@/` alias, no React Native
    // modules. A value import here breaks `expo start` at build time, which
    // no other check in this repo would catch.
    const source = readFileSync(
      join(MOBILE_ROOT, "constants/strings.ts"),
      "utf8",
    );
    const valueImports = source
      .split("\n")
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(
        ({ line }) => /^import\s/.test(line) && !/^import\s+type\s/.test(line),
      );
    expect(valueImports).toEqual([]);
  });
});
