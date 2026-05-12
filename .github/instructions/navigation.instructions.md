---
description: "Use when writing or editing Expo Router layout files (_layout.tsx) or any file that configures Stack/Tab navigators. Enforces explicit animation, themed contentStyle, and transition consistency."
applyTo: "src/app/**/_layout.tsx"
---

# Navigation & Transitions Rules

## Stack Animation (mandatory)

Every `Stack` in `src/app/**/_layout.tsx` **must** set `screenOptions.animation` explicitly. Never leave a Stack without it — inconsistent transitions break the premium feel.

```tsx
// ❌ BAD — no animation set, OS default varies per platform/version
<Stack screenOptions={{ headerShown: false }} />

// ✅ GOOD — explicit animation + themed background
const palette = useThemeColors();

<Stack
  screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: palette.background },
    animation: 'slide_from_right',
  }}
/>
```

## Animation Choices

| Case | Animation |
|------|-----------|
| Default push (root + nested stacks) | `slide_from_right` |
| Intentional cross-fade between two peers | `fade` (per-screen override only) |
| Splash / no-motion screen | `none` (per-screen override only) |

- **Do not** use `fade` globally — it creates a persistent dimmed veil on some Android / Fabric builds.
- **Do not** use `slide_from_bottom` for standard navigation — reserve for modals/sheets.

## Per-Screen Overrides

Override only the screen that needs it. Do not change the whole stack:

```tsx
<Stack.Screen name="modal" options={{ animation: 'slide_from_bottom' }} />
<Stack.Screen name="splash" options={{ animation: 'none' }} />
```

## contentStyle

Always set `contentStyle` with the themed background color alongside `animation` to prevent a wrong-color backdrop flash during transitions:

```tsx
contentStyle: { backgroundColor: palette.background }
```

## Sibling Stacks

When adding nested layouts, match sibling stacks so auth, onboarding, and home transitions feel cohesive. All should use `slide_from_right` unless there's a deliberate reason.

## Route Names

- Centralize all route names in `src/constants/routes.ts`.
- Never string-literal `router.push('/some/path')` in screens — always use the constant.

```ts
// ❌ BAD
router.push('/home/create-group');

// ✅ GOOD
import { ROUTES } from '@/constants/routes';
router.push(ROUTES.HOME.CREATE_GROUP);
```

## Route Files Stay Thin

`src/app/**/*.tsx` route files contain no business logic. Extract to `features/<name>/screens/`.
