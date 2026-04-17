# Blob-o-dads

Location-aware social web app built on **AWS Amplify Gen 2** + **React 19** + **Vite 8** + **Mantine**.

Users appear to each other as colored, position-obfuscated circles on a Google Map within a 10-mile radius, can ping a nearby person to start an ad-hoc "Hangout" group, and see a computed centroid "meeting place" marker with an arrow from their own position.

## Local setup

```bash
npm install
cp .env.example .env    # then fill in VITE_GOOGLE_MAPS_API_KEY
npm run sandbox         # deploy Amplify sandbox (first time — emits amplify_outputs.json)
npm run dev             # start Vite dev server at http://localhost:5173
```

You need a Google Maps JavaScript API key. Restrict it to your `http://localhost:5173` referrer plus the prod origin when you deploy.

Cognito SMS starts in sandbox mode — new phone numbers must be whitelisted in the Cognito console before SMS OTP will deliver.

## Scripts

```bash
npm run dev              # Vite dev server with HMR
npm run build            # tsc -b && vite build
npm run lint             # ESLint (flat config)
npm run preview          # serve the built bundle
npm run sandbox          # npx ampx sandbox (deploy/watch backend)
npm run sandbox:delete   # tear it down
```

## Architecture

```
Routes
  /login           phone entry + OTP verify
  /onboarding      first-login: name, ageRange, availability, geo permission
  /map             home: Google Map + TopNav + drawers   (AuthGuard + OnboardedGuard)
  /groups/:id      group view: members, rename, leave/delete

Amplify resources
  amplify/backend.ts              defineBackend({ auth, data, cleanupGroups })
  amplify/auth/resource.ts        phone + SMS OTP, 365d refresh token
  amplify/data/resource.ts        User, Group, GroupMember, Ping
  amplify/functions/cleanup-groups/
     resource.ts                  schedule: 'every 5m'
     handler.ts                   deletes empty groups + stale-solo (>1h)
```

All map tunables (poll interval, circle radius by zoom, offset magnitude, colors) live in `src/constants/map.ts` — edit freely.

## Known risks

- **Cognito SMS sandbox** — whitelist numbers, then request production access.
- **Google Maps billing** — restrict the API key + set a budget alert.
- **Privacy** — the current schema allows any authenticated user to read raw `lat/lng`. The UI obfuscates, but before public launch replace with a custom resolver that projects away coordinates and returns only the centroid.
- **iOS Safari geolocation** — requires HTTPS + per-session permission.
- **No ping rate-limit** in V1. Plan a per-(from,to) cooldown for V1.5.
