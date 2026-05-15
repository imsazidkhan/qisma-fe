# Qisma — Copilot Instructions

Expo Router + React Native app. **Design language: Nothing OS** — monochrome, industrial, minimal, technical, typography-first, high whitespace, calm motion. TypeScript strict, React 19, Expo SDK 54, RN 0.81, pnpm.

See `.cursor/rules/` for full detail on every domain. This file enforces the always-on rules.

---

## Design Identity

UI must feel like **Nothing OS / premium hardware / industrial minimalism**.
Must NOT feel like: generic SaaS, Material Design, colorful startup, gaming UI, social media.

**When in doubt: remove, don't add. Whitespace > separators. Type > chrome.**

---

## TypeScript

- `strict` mode + `noUncheckedIndexedAccess` — handle `undefined` from arrays/records.
- Never use `any`. Prefer `unknown` and narrow with type guards.
- Type every exported function signature (params + return type). No implicit returns.
- Named exports over default exports.
- `as const` objects or enums for magic strings — never bare string literals.

---

## Architecture & Folder Structure (sacred)

```
src/
├── api/               HTTP client, queryClient, endpoints, base URL resolver
├── app/               Expo Router routes ONLY — thin, no business logic
├── components/ui/     Reusable theme-driven primitives
├── constants/         Static config, route names, storage keys, analytics events
├── features/<name>/   Vertical slice: api/ components/ hooks/ screens/ store/ types/
├── hooks/             Cross-feature hooks
├── i18n/              i18next + locales/
├── services/          Side-effect singletons (analytics, storage, logger, deviceId)
├── store/             Global Zustand stores (rare — prefer feature-local)
├── theme/             SOURCE OF TRUTH for all visual tokens
├── types/             Ambient + shared types
└── utils/             Pure helpers — no React, no I/O
```

- Use `@/` alias for all imports — no relative `../../..`.
- Re-export feature publics from `features/<name>/index.ts`.
- Don't add new top-level folders without a strong reason.
- One exported component per file. File names: kebab-case for modules, PascalCase for components.
- Use DTOs to map API shapes → domain types; never pass wire types to UI.
- Route names centralized in `src/constants/routes.ts` — no string-literal `router.push('/...')`.

---

## Color & Theme — ALWAYS `useThemeColors()`

```tsx
// ❌ WRONG — hardcoded, won't react to theme
<View style={{ backgroundColor: '#0A0A0A' }} />;
import { colors } from '@/theme';
<View style={{ backgroundColor: colors.surfaceElevated }} />; // dark-only

// ✅ CORRECT — subscribes to active palette, flips light/dark
import { useThemeColors } from '@/theme';
const palette = useThemeColors();
<View style={{ backgroundColor: palette.surfaceElevated }} />;
```

- **Never hardcode colors, spacing, radius, typography, shadows.**
- The static `colors` export is the dark palette only — never use inside JSX.
- NativeWind layout utilities (`flex-*`, `p-*`, `gap-*`, `rounded-*`, `border` width) are fine.
- NativeWind **color** utilities (`bg-background`, `text-textPrimary`) resolve dark only — do NOT use for theme-sensitive surfaces.
- Every component must render correctly in **both light and dark**.
- `palette.accent` is reserved: focus rings, selected state, single primary CTA per screen, key status indicators. Never decorative.
- Status colors (`success`, `error`, `warning`, `info`) only for genuine status.
- Reanimated `useAnimatedStyle` — pass palette colors as the second-arg deps so style re-evaluates on theme swap.

---

## Visual Rules

- Near-black backgrounds (`palette.background`, `palette.surface*`).
- Semantic surface hierarchy: `surfaceBase → surfaceElevated → surfaceFloating → surfaceRaised → surfaceOverlay`.
- **Thin borders, not shadows** (`border border-border`).
- Outlined components > filled. Whitespace > dividers.
- Conservative radii: `rounded-sm`, `rounded-md`, `rounded-card` — never pill-everything.

**Forbidden:** colorful UI, gradients (unless explicitly requested), neumorphism, Material Design (FABs/raised cards/ripples), glassmorphism-heavy UI, random elevation shadows, decorative UI without function, oversized CTA buttons, bouncy/cartoon animations.

---

## Typography

- **Mono** (`font-mono*` / `textStyles.code*`) for: labels, metadata, timestamps, counters, status text, IDs, versions.
- **Uppercase** for system labels (`textStyles.overline` or `tracking-widest uppercase`).
- Large headings: `semiBold` (600) not `bold` (700) — reserve bold for true emphasis.
- **Tabular numbers** for clocks, stats, prices, counters (`textStyles.numeric*`).

---

## Spacing

- Strict spacing scale only. Use `spacing.*` tokens or NativeWind `p-*`/`m-*`/`gap-*`.
- Respects 8pt grid. Spacious, intentional layouts.
- **Forbidden:** arbitrary spacing (`style={{ padding: 13 }}`), dense UI.

---

## State Management

- **Server state → TanStack Query.** Anything from a backend lives here.
- **Client state → Zustand.** UI state, flow machines, ephemeral flags.
- Subscribe Zustand with narrow selectors: `useStore(s => s.field)` not `useStore()`.
- Prefer feature-local stores. Avoid giant global stores.
- Never duplicate derived state — compute from source on render.

---

## API Layer

- Never call `fetch` directly in a component. All endpoint calls are typed functions in `features/<name>/api/`.
- Validate every API response with **Zod at the edge** before it enters the app.
- Map every backend error code → UI error via a central parser. Never display raw server messages.
- Errors flow through `ApiError` (`src/api/ApiError.ts`) — never raw thrown strings.
- `async/await` only — no raw `.then` chains.
- Never auto-retry side-effecting writes (`/otp/send`, create, delete).
- All requests take an `AbortSignal` and are cancelled on unmount.

---

## React Native Platform

- **MMKV** via `@/services/storage` only — never call MMKV directly from a screen/hook.
- Auth tokens go in `expo-secure-store` (Keychain/Keystore) — NEVER MMKV or AsyncStorage.
- `KeyboardAvoidingView`: `behavior="padding"` on iOS, `behavior="height"` on Android.
- Pin primary CTA above keyboard — wrap content in `ScrollView keyboardShouldPersistTaps="handled"`.
- Handle background ↔ foreground via `AppState`: recompute time-sensitive state from absolute timestamps on `active`.
- TanStack Query's `onlineManager` bound to NetInfo — already wired in `src/api/onlineManager.ts`, keep it.
- Treat 5xx as ambiguous — surface to user, don't silently retry side-effecting writes.

---

## Performance

- Reanimated worklets for all animations — never JS-driven animations.
- `react-native-gesture-handler` for gestures — never `PanResponder`.
- `useNativeDriver: true` on all `Animated` usage.
- `FlashList` for large datasets (>50 items or async-loaded feeds).
- `FlatList`: always set `keyExtractor`, `getItemLayout` (fixed height), `removeClippedSubviews`.
- Hoist `renderItem` and callbacks with `useCallback` — no inline arrow functions in lists.
- Debounce search/autosave 250–400ms. Throttle scroll/drag 16ms.
- Never poll across the bridge in `setInterval`.
- Import `Easing` from `react-native-reanimated`, **never** from `react-native`.

---

## Motion

- Subtle fade & slide only. **No bounce, no playful springs.**
- Use `duration.*` and `easing.*` tokens from `@/theme`.
- `withTiming(1, { duration: duration.standard.ms, easing: easing.standard.rn })`.
- Respect `AccessibilityInfo.isReduceMotionEnabled()` — skip non-essential motion.

---

## Observability & Logging

- No `console.log` in committed code. Use `@/services/logger`.
- Sentry via `@/services/logger` facade only — never sprinkle `Sentry.*` calls.
- Tag every error with `error_code`, `endpoint`, `app_version`.
- **No PII** (phone, email, OTP, sessionId) in logs or analytics events.
- Analytics events are typed constants in `src/constants/analyticsEvents.ts` — add there before firing.

---

## Accessibility (non-optional)

- Every interactive element: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`.
- Live status changes: `AccessibilityInfo.announceForAccessibility`.
- Verify focus order, WCAG AA contrast, and screen-reader output per state.

---

## Do NOT Reintroduce

- Hardcoded hex/px/rem in components.
- `colors.X` static imports inside JSX.
- NativeWind color utilities for theme-sensitive surfaces.
- Business logic in `src/app/` route files.
- New global stores when a feature-local store suffices.
- Random elevation shadows, gradients, colorful fills, bouncy animations, oversized CTAs.
- New screens/components unverified in both light **and** dark.
- `index` as list key for dynamic data.
- `console.log` in committed code.
