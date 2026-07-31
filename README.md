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

Requires [Bun](https://bun.sh), a Convex account, and an Android emulator or a
device running Expo Go.

```bash
bun install
bun run --filter @packages/backend setup   # provisions YOUR OWN Convex dev deployment
bun run dev                                 # syncs env, then starts Convex + Expo
```

**The setup step is interactive — choose a Convex Cloud deployment.** It offers a
cloud deployment or an anonymous local one. We use **cloud**: it gives you an
`https://….convex.cloud` URL that any emulator, phone, or teammate's device can
reach with no tunnelling, and it gives us a Convex dashboard to screenshot as
deployment evidence for the report. If you pick local instead, see
"Using a local Convex deployment" below for the extra setup you will need.

Open the app and navigate to `/debug`. You should see a server timestamp, and
tapping **Touch** should increment the counter with no refresh. That live update
is the thing worth checking — it is the platform assumption the community
verification features depend on.

### How the URL reaches Expo

`bun run dev` runs `scripts/sync-convex-env.ts`, which copies `CONVEX_URL` from
`packages/backend/.env.local` into `apps/mobile/.env.local` as
`EXPO_PUBLIC_CONVEX_URL`. The Convex CLI cannot write that value across package
boundaries, which is why the script exists. If it ever fails, write the file
yourself:

```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Running on an emulator

Convex is reachable over the public internet, so **only the Metro dev server needs
help** — the emulator cannot route to your Mac's LAN address, which is what Expo
advertises by default.

```bash
adb reverse tcp:8081 tcp:8081
bunx expo start --localhost
```

Without `--localhost`, Expo hands the emulator something like
`exp://192.168.1.14:8081`. The symptom is the app hanging on a spinner, and
`adb logcat` showing `Couldn't connect to "ws://192.168.1.x:8081"`.

A real device on the same Wi-Fi needs neither flag — the LAN address works.

**Expo Go's version must match the project's SDK.** This project is on SDK 57, so
an emulator carrying Expo Go 54 fails with "Project is incompatible with this
version of Expo Go". Uninstall it (`adb uninstall host.exp.exponent`) and let
`bunx expo start --android` install the matching build.

## Using a local Convex deployment

Only if you chose local at setup. `CONVEX_URL` is then `http://127.0.0.1:3210` —
correct on your Mac, wrong on every device, since `127.0.0.1` on a phone means the
phone itself.

| Target                   | What to do                        |
| ------------------------ | --------------------------------- |
| Android emulator         | `adb reverse tcp:3210 tcp:3210`   |
| USB-tethered device      | `adb reverse tcp:3210 tcp:3210`   |
| Device on the same Wi-Fi | set `CONVEX_URL_OVERRIDE` (below) |

For a Wi-Fi device, add one line to `packages/backend/.env.local`:

```
CONVEX_URL_OVERRIDE=http://192.168.1.x:3210
```

`scripts/sync-convex-env.ts` prefers that over `CONVEX_URL`, so `bun run dev` stops
overwriting your address. The file is git-ignored, so everyone can point at their
own machine.

A local backend only listens while a Convex dev process is running. If the debug
screen hangs on "Connecting to Convex…", check the port before suspecting the
subscription.

## Deployments

Each developer runs the setup step once and gets their **own** cloud dev
deployment, so we never contend over one backend. `master` maps to the single
production deployment, deployed by `bunx convex deploy` **from CI only** — do not
run `convex deploy` from your laptop.

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

### Seeding Public Spaces (US-06)

To populate the Convex database with ~150 real public spaces in Greater Colombo & Malabe (including hospitals, transit hubs, universities, parks, and malls) and index them in the geospatial engine:

```bash
bun run seed              # Idempotently inserts ~150 places and builds the geo index
```

To re-fetch fresh OpenStreetMap POIs via the Overpass API:
```bash
bun run seed:osm          # Fetches latest POIs from OSM Overpass into seed dataset
```

## Commands

| Command               | Effect                                                     |
| --------------------- | ---------------------------------------------------------- |
| `bun run dev`         | Sync env, then run Convex and Expo together                |
| `bun run seed`        | Idempotently seed ~150 real public spaces into Convex & geo|
| `bun run seed:osm`    | Fetch latest OSM Overpass POIs for Greater Colombo         |
| `bun run lint`        | ESLint across all workspaces                               |
| `bun run check-types` | `tsc --noEmit` for `scripts/`, then both workspaces        |
| `bun run test`        | Unit tests for `scripts/`                                  |
| `bun run format`      | Prettier write                                             |

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

- S0-5 (`convex/schema.ts`) has declared the `health` table validator (`health: defineTable({ count: v.number() })`) alongside the core entity model (`users`, `places`, `reports`, `verifications`, `flags`), preserving the `/debug` screen and health tests.
- `.github/CODEOWNERS` uses placeholder handles `@M1`–`@M4` until real GitHub
  usernames are confirmed. GitHub silently ignores handles that don't exist, so
  reviewer auto-assignment does nothing until they are replaced.
