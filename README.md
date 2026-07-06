# Inclusive Public Space Accessibility Mapper

SE3080 Assignment 1 — Expo (React Native) + Convex, in a Bun/Turborepo monorepo.

## Layout

```
apps/mobile                 Expo app (expo-router, SDK 57)
packages/backend            Convex functions — @packages/backend
packages/eslint-config      Shared ESLint 9 flat config — @repo/eslint-config
packages/typescript-config  Shared TypeScript options — @repo/typescript-config
scripts/                    Repo tooling (not a workspace)
```

## Setup

Requires [Bun](https://bun.sh) and an Android emulator or a device running Expo Go.

```bash
bun install
bun run --filter @packages/backend setup   # provisions YOUR OWN Convex deployment
adb reverse tcp:3210 tcp:3210               # emulator/USB device only — see below
bun run dev                                 # syncs env, then starts Convex + Expo
```

**The setup step is interactive and the choice matters.** It asks whether you want
a Convex Cloud deployment or a local one. This project was set up with a **local**
deployment, which is why `adb reverse` is in the steps above. If you pick cloud
instead you get an `https://….convex.cloud` URL that any device can reach, and you
can skip `adb reverse` and the whole "Reaching Convex from a device" section.

Open the app and navigate to `/debug`. You should see a server timestamp, and
tapping **Touch** should increment the counter with no refresh. That live update
is the thing worth checking — it is the platform assumption the community
verification features depend on.

## Reaching Convex from a device

We use a **local** Convex deployment, so `CONVEX_URL` is `http://127.0.0.1:3210`.
That address is correct on your Mac and wrong on every phone — `127.0.0.1` on a
device means the device itself.

| Target                   | What to do                                                    |
| ------------------------ | ------------------------------------------------------------- |
| Android emulator         | `adb reverse tcp:3210 tcp:3210`, then no env change is needed |
| USB-tethered device      | `adb reverse tcp:3210 tcp:3210`, same as above                |
| Device on the same Wi-Fi | set `CONVEX_URL_OVERRIDE` (below)                             |

For a Wi-Fi device, add one line to `packages/backend/.env.local`:

```
CONVEX_URL_OVERRIDE=http://192.168.1.x:3210
```

`scripts/sync-convex-env.ts` prefers that over `CONVEX_URL`, so `bun run dev`
stops overwriting your address. The file is git-ignored, so everyone can point at
their own machine.

**The local backend only listens while a Convex dev process is running** — either
`bun run dev` (which starts it via Turbo) or `bun run --filter @packages/backend dev`
on its own. If the debug screen hangs on "Connecting to Convex…", check the port
before suspecting the subscription.

### How the URL reaches Expo

`bun run dev` runs `scripts/sync-convex-env.ts`, which copies `CONVEX_URL` (or
`CONVEX_URL_OVERRIDE`) from `packages/backend/.env.local` into
`apps/mobile/.env.local` as `EXPO_PUBLIC_CONVEX_URL`. The Convex CLI cannot write
that value across package boundaries, which is why the script exists. If it ever
fails, write the file yourself:

```
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

## Deployments

Each developer runs the setup step once and gets their own deployment, so we never
contend over one backend. `master` maps to the production deployment, deployed by
`bunx convex deploy` **from CI only** — do not run `convex deploy` from your laptop.

## Branching

```
master     protected, release
 └ develop protected, integration — default branch
    └ feature/US-03-nearby-map
    └ fix/<slug>
    └ chore/<slug>
```

Branch names carry the ClickUp story ID so git history maps onto the board.
Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

Every change reaches `develop` through a reviewed PR. Branch protection was
enabled **after** the initial scaffold landed — protecting an empty repository
deadlocks the first PR, since there is nothing for a reviewer to review.

## Commands

| Command               | Effect                                              |
| --------------------- | --------------------------------------------------- |
| `bun run dev`         | Sync env, then run Convex and Expo together         |
| `bun run lint`        | ESLint across all workspaces                        |
| `bun run check-types` | `tsc --noEmit` for `scripts/`, then both workspaces |
| `bun run test`        | Unit tests for `scripts/`                           |
| `bun run format`      | Prettier write                                      |

A Husky pre-commit hook runs `lint-staged` → `lint` → `check-types`. There is no
build step in this repo, so the hook does not run one.

## Conventions and gotchas

- **Internal dependencies use `"*"`, not `"workspace:*"`.** Bun 1.3 fails to
  resolve the `workspace:` protocol here.
- **Adding a new workspace package? Delete `bun.lock` and reinstall.** Bun caches
  the workspace list in the lockfile; without regenerating it, the new package is
  invisible and Bun tries the npm registry instead, giving a confusing 404.
- **ESLint configs are `eslint.config.mjs`, not `.js`.** As `.js` in a package
  without `"type": "module"`, Node warns on every lint run.
- **`packages/backend/convex/_generated/` is committed.** A fresh clone can
  typecheck without a Convex deployment, and CI needs no Convex secret.
- **`@packages/backend` has no `exports` field, deliberately.** Deep imports such
  as `@packages/backend/convex/_generated/api` depend on its absence.
- **`scripts/` is not a workspace**, so the root `tsconfig.json` exists purely to
  bring it under `tsc`. That is why `check-types` runs `tsc` before Turbo.
- **Point your IDE's formatter at Prettier.** JetBrains' built-in formatter
  disagrees with our Prettier config and will fight it on every save — including
  on Convex's generated files. Enable Prettier under Settings → Languages &
  Frameworks → JavaScript → Prettier, and mark
  `packages/backend/convex/_generated` as excluded.

## Known hand-offs

- `convex/health.ts` creates a `health` table with no schema. When S0-5 adds
  `convex/schema.ts`, either declare a `health` table validator or delete
  `health.ts` and the `/debug` screen.
- `.github/CODEOWNERS` uses placeholder handles `@M1`–`@M4` until real GitHub
  usernames are confirmed. GitHub silently ignores handles that don't exist, so
  reviewer auto-assignment does nothing until they are replaced.
