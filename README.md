# Qisma

Expense splitting for groups. Built with Expo Router + React Native, designed in the spirit of Nothing OS — monochrome, industrial, typography-first.

| | |
| --- | --- |
| Expo SDK | 54 |
| React Native | 0.81 |
| React | 19 |
| TypeScript | 5.9 (strict, `noUncheckedIndexedAccess`) |
| Router | Expo Router (typed routes) |
| Styling | NativeWind 4 + theme tokens |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| Forms | react-hook-form + zod |
| Storage | MMKV (general), expo-secure-store (auth tokens) |
| OTA | hot-updater |
| Crash / analytics | Firebase (optional) |

---

## Prerequisites

- Node `>=20.19.0`
- pnpm `10.33.0` (this project pins `packageManager`; just run `corepack enable`)
- iOS Simulator (Xcode) and/or Android Emulator (Android Studio)
- A running [auth-service](https://example.invalid/) on `http://localhost:3000` (or set `EXPO_PUBLIC_API_BASE_URL`)

## Quickstart

```bash
pnpm install
pnpm start          # Expo dev server
pnpm ios            # build & run on iOS Simulator
pnpm android        # build & run on Android Emulator
pnpm web            # web target (limited support)
```

## Environment

All public env vars are prefixed `EXPO_PUBLIC_*` so they are inlined by Metro.

| Var | Required | Default | Notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | release | auto (dev) | Auth-service origin. `/v1` is appended automatically. In dev, falls back to `localhost:3000` / `10.0.2.2:3000` / Expo `hostUri`. |
| `EXPO_PUBLIC_HOT_UPDATER_BASE_URL` | no | — | Enables `@hot-updater/react-native` when set. |
| `EXPO_PUBLIC_HOT_UPDATER_CHANNEL` | no | `production` | OTA channel for hot-updater. |

Create `.env.local` (gitignored) for local overrides:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.5:3000
```

### Firebase (optional)

Drop `GoogleService-Info.plist` and/or `google-services.json` at the project root. Both are gitignored. `app.config.ts` auto-wires `@react-native-firebase/app` when present.

---

## Project layout

Routes live in `src/app/`, **not** the root `app/` directory (configured via `extra.router.root` in `app.config.ts`).

```
src/
├── api/               HTTP client, queryClient, error envelope, base-URL resolver
├── app/               Expo Router routes (thin — extract logic to features/)
│   ├── (auth)/        Auth route group
│   ├── home/          Authed routes (tabs, group details, expense screens, ...)
│   ├── onboarding/    Name / use-case / avatar onboarding
│   └── groups/        Deep-link entry points (invite acceptance)
├── components/ui/     Theme-driven primitives (Button, Input, BackHeaderButton, ...)
├── constants/         Routes, query keys, storage keys, analytics events
├── features/<name>/   Vertical slices — api/, components/, hooks/, screens/,
│                      store/, types/, utils/
├── hooks/             Cross-cutting hooks (network status, debounce, ...)
├── i18n/              i18next + locales
├── navigation/        Shared navigator types / linking config
├── services/          Side-effect singletons (analytics, storage, logger, deviceId)
├── store/             Global Zustand stores (kept minimal)
├── theme/             Single source of truth — tokens flow to Tailwind + TS
└── utils/             Pure helpers (no React, no I/O)
```

Features currently scaffolded: `auth`, `expenses`, `groups`, `invites`, `activity`, `contacts`, `home`, `onboarding`, `profile`, `notifications`, `qisma` (chrome).

## Architecture highlights

- **Strict layering.** UI never imports raw API responses — all features expose typed DTOs from `features/<name>/api/`.
- **Server vs client state.** TanStack Query for anything fetched; Zustand for UI / flow state. Never duplicate derived state.
- **Resilient networking.** Every request has an `AbortController` and a 10–15s timeout. `onlineManager` and `focusManager` are bound to NetInfo and `AppState` for offline-aware refetching.
- **Auth retry.** `authRetry.ts` handles silent token refresh and forced-logout navigation on a single source of truth.
- **Centralized error parsing.** Backend error codes are mapped to user-facing messages in feature-level `parse*Error.ts` helpers — raw server strings never reach the UI.
- **Theme tokens.** Edit `src/theme/*.tokens.ts` once → values flow to `tailwind.config.ts` and `.ts` façades. Components read colors via `useThemeColors()` (light + dark, no `if (mode === 'dark')` branches).

See `.cursor/rules/` and `docs/DESIGN_RULES.md` for the full house style.

---

## Quality gates

Run before every push:

```bash
pnpm format:check
pnpm lint
pnpm exec tsc --noEmit
```

Format on save is fine; `pnpm format` rewrites the tree with Prettier.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm start` | Expo dev server |
| `pnpm ios` / `pnpm android` / `pnpm web` | Run on a target |
| `pnpm lint` | ESLint (Expo + Prettier configs) |
| `pnpm format` / `pnpm format:check` | Prettier write / verify |
| `pnpm reset-project` | Wipe local Expo state (`scripts/reset-project.js`) |

---

## Design language

Qisma should feel like a piece of premium hardware software, not a SaaS dashboard.

- Near-black backgrounds, thin borders instead of shadows, generous whitespace.
- Monochrome palette; `accent` is reserved for focus rings, a single primary CTA per screen, and key status indicators.
- Typography-first: mono for labels / metadata / timestamps, restrained weight for headings, tabular numbers for stats.
- Calm, mechanical motion (no springs, no bounce). Reanimated worklets, native driver only.
- Every component renders correctly in **both** light and dark — verified via the in-app `ThemeToggle`.

If a divider, shadow, or color isn't earning its place, delete it.

---

## Deep links

Custom scheme: `qisma://`. Example invite link:

```
qisma://groups/<uuid>/invite
```

Routes are typed (Expo `experiments.typedRoutes: true`) — `Href<...>` errors at the call site mean the route doesn't exist.

## OTA updates

`hot-updater.config.ts` defines the OTA build pipeline. Wire a `database` + `storage` target (Firebase, AWS S3, etc.) to enable self-hosted OTA — see comments in the config file for examples.

---

## Contributing

1. Read `.cursorrules` and the rules in `.cursor/rules/` — they are not optional.
2. Reuse theme tokens and `@/components/ui` primitives; do not hardcode hex / px values.
3. Keep route files thin; put business logic in `features/<name>/`.
4. Verify every change in **both** light and dark mode before opening a PR.
