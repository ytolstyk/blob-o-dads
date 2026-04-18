# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # tsc -b && vite build
npm run lint             # ESLint
npm run preview          # preview production build
npm run sandbox          # npx ampx sandbox — deploy/watch Amplify backend
npm run sandbox:delete   # tear down the sandbox
```

No test runner yet. Backend typegen runs as part of `npm run sandbox`.

## Architecture

React 19 + TypeScript SPA (Vite 8), Mantine UI, React Router v7, Google Maps via `@vis.gl/react-google-maps`, AWS Amplify Gen 2 (Cognito phone auth + AppSync/DynamoDB).

- `src/main.tsx` — Amplify.configure + MantineProvider + Notifications + ErrorBoundary + Router
- `src/App.tsx` — route table (`/login`, `/onboarding`, `/map`, `/groups/:id`)
- `src/routes/` — one file per top-level route, plus `AuthGuard` + `OnboardedGuard`
- `src/components/` — presentational + map overlay components
- `src/hooks/` — data-fetching + subscription hooks (naming: `use*`)
- `src/lib/` — pure helpers: `amplify`, `dataClient`, `geohash`, `distance`, `color`, `offset`, `centroid`
- `src/constants/map.ts` — **all** map tunables (poll interval, circle radius by zoom, offset cap, colors). Edit freely.
- `amplify/` — Gen 2 backend: `auth`, `data`, `functions/cleanup-groups`, `backend.ts`

### Auth

Phone + SMS OTP via Cognito. `LoginRoute` handles both sign-in and first-time sign-up (with a throwaway password + `autoSignIn`). Refresh token validity is 365d via the `cfnUserPoolClient` escape hatch in `amplify/backend.ts`.

### Data model

`User` (keyed on Cognito sub via `userId` field + secondary index), `Group`, `GroupMember`, `Ping`. `User.geohashPrefix` (precision 4) is the secondary index used for "nearby" queries (self + 8 neighbors, then haversine-filter client-side to `NEARBY_RADIUS_MILES`).

Peer reads of raw `lat/lng` are allowed by the schema today — acceptable while the UI obfuscates, but before public launch replace with a custom `listUsersNearby` resolver that projects away raw coordinates.

### Realtime

All "live" hooks use Amplify Data's `observeQuery` (AppSync subscriptions under the hood). Location writes still poll every `POLL_INTERVAL_MS` (10s), paused while the tab is hidden.

### Cleanup lambda

`amplify/functions/cleanup-groups/` runs every 5 minutes. Deletes empty groups and solo-member groups older than 1h. The in-app leave flow also deletes the group when the last member leaves; the lambda is a safety net. Schema-level `allow.resource(cleanupGroups).to(['query','mutate'])` grants it API access.

## Gotchas

- **tsconfig `strict: true` is required.** Amplify's `createType` / `updateType` conditional inference collapses to `string[]` without strict mode.
- **`Map` is imported** from `@vis.gl/react-google-maps` — don't `new Map<K,V>()` inside MapRoute (use `Record<K, V>` or alias the import).
- **`$amplify/env/<fn>`** paths inside lambda handlers resolve via the alias in `amplify/tsconfig.json`; the file is generated during `ampx sandbox`.
- **`amplify_outputs.json`** is gitignored. A stub is committed so frontend imports compile before the first sandbox deploy.
- **Google Maps Circle** uses **meters** — the constants file already translates `400ft` / `2000ft`.

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

<!-- /rtk-instructions -->
