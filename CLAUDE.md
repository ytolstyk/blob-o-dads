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
