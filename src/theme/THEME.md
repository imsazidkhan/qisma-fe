# Theme System

The single source of truth for every visual decision in the app — colors,
typography, spacing, radius, borders, shadows, motion, and ready-to-spread
component presets. Every primitive in `src/components/ui/*` reads from here,
and `tailwind.config.ts` reuses the same files so NativeWind utilities resolve
to identical pixel-exact values.

```
src/theme/
├── colors.tokens.ts       primitives  ─┐  consumed by tailwind.config.ts
├── typography.tokens.ts                │  AND the .ts façades below
├── spacing.tokens.ts                   │
├── radius.tokens.ts                    │
├── borders.tokens.ts      ─────────────┘
│
├── colors.ts              façades + semantic layer + RN-specific helpers
├── typography.ts          (textStyles, fontFamily nested view)
├── spacing.ts             (space.*, size.*, legacy aliases)
├── radius.ts              (sheet partial radius)
├── borders.ts             (borders.* compound presets)
├── shadows.ts             (platformShadow, coloredShadow)
├── motion.ts              (duration, easing, spring, transition)
├── components.ts          (component.button, .input, .card, ... presets)
└── index.ts               barrel — import from `@/theme`
```

> **Single source of truth.** Tailwind/NativeWind classes (`p-4`,
> `text-textPrimary`, `rounded-card`) and TypeScript values
> (`spacing['4']`, `colors.textPrimary`, `radius.card`) read from the
> exact same `.tokens.ts` files. There is no `.js`/.d.ts shadow pair to
> keep in sync.

---

## How to use

### Prefer NativeWind utilities for layout

```tsx
<View className="flex-row items-center gap-2 p-4 rounded-card bg-surface" />
```

Resolves to `padding: 16, borderRadius: 12, backgroundColor: '#0A0A0A'`.

### Use token TS exports for dynamic values, animations, or precise interop

```tsx
import { colors, radius, spacing } from '@/theme';
withTiming(spacing[4], { duration: 200 });
```

### Use compound presets for typography + components

```tsx
import { textStyles, component } from '@/theme';

<RNText style={textStyles.h2} />
<View style={[component.card.elevated]} />
```

### Or — preferred — use the primitive components

```tsx
import { Button, Card, Text, Input, Skeleton } from '@/components';

<Card variant="elevated">
  <Text variant="h3">Title</Text>
  <Text color="textSecondary">Subtitle</Text>
  <Button label="Confirm" variant="primary" onPress={onConfirm} />
</Card>;
```

---

## Finance UI language (Nothing OS)

Qisma’s split‑expense surfaces aim for a **premium handheld finance OS**, not generic SaaS or Material patterns. This section defines **intent**; tokens and primitives remain in `*.tokens.ts` and `@/components`.

### Intent

| Quality                     | Execution                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| **Minimal & calm**          | Few controls per viewport; whitespace carries meaning; no ornamental chrome.                       |
| **Futuristic / engineered** | Mono rails for metadata, IDs, amounts, section kickers; rectilinear layouts aligned to one gutter. |
| **Structured**              | **`layoutGrid`** for finance rails + **`space.*`** elsewhere — no arbitrary spacing.               |
| **Precision**               | Tabular numerics where money moves (`fontVariant: ['tabular-nums']`, numeric styles).              |

Every layout decision should answer: _would this align if we snapped it to an 8 × 8 dp invisible grid?_ The spacing scale is **4 px base** (pairs merge into **8 pt rhythm**: `gap-sm = 8`, `gap-md = 16`, `sectionGap = 32`, …).

### Layout grid (`layoutGrid` in `@/theme`)

Canonical finance rails — **header, tabs, scroll body, cards, and split rows share `layoutGrid.inset` (24 px)** horizontal padding:

| Token     | px  | Use                                       |
| --------- | --- | ----------------------------------------- |
| `micro`   | 8   | Micro stacks, tight chrome gaps           |
| `sm`      | 16  | Sibling gaps inside sections              |
| `inset`   | 24  | **Screen gutter** + card interior padding |
| `section` | 32  | Vertical rhythm between major blocks      |
| `major`   | 40  | Scroll foot / large separation            |

Import: `import { layoutGrid } from '@/theme'`. Prefer these steps over ad‑hoc numbers so columns stay optically aligned.

### Palette & surfaces

- **Use `useThemeColors()`** in RN views — never static `colors` or hex in features (both schemes stay monochrome‑first).
- **Light:** warm paper / gray canvas (`background`), white/off‑white **layers** (`surfaceBase`, `surfaceElevated`), ink typography (`textPrimary`). Borders via **`borderSubtle`** / **`border`** — soft gray, never harsh black slabs around everything.
- **Dark:** near‑black canvas + elevated charcoal surfaces; **accent** is restrained lime **only** for primary emphasis / focus (never rainbow accents across unrelated widgets).

Minimal accent policy: **one** dominant accent action per screen; secondary actions outlined or tonal.

### Depth & borders

- Prefer **tonal separation** (`surfaceBase` → `surfaceElevated`) and **`StyleSheet.hairlineWidth`** borders over elevation.
- **Shadows:** use sparingly — **`platformShadow('xs')`**, **`'premiumCard'`**, or **palette‑based soft blooms** only where something reads as “floating” (hero cards, sheets). Avoid stacks of heavy shadows or saturated glows.

### Geometry

- Corners come from **`radius.*`** — semantic shells (`card`, `inviteCard`, `full` pills). Prefer consistent radius families within one surface hierarchy on a screen.
- Avoid cartoon‑thick strokes or symmetric blob layouts.

### Typography

- **Sans (Inter)** drives prose and display headings; keep hierarchy mostly via **size + spacing**, not escalating weights everywhere (**semiBold** over heavier stacks unless emphasis truly demands it).
- **Mono (JetBrains Mono)** for technical rails: balances, timestamps, codes, uppercase kickers.
- **Letter‑tracking:** display headings often pair **`letterSpacing.tighter`** / **`tight`**; rails use **`wide`** / **`wider`** / **`widest`** (already wired into `textStyles.overline` and presets).

### What we deliberately avoid

- Heavy shadows, bright gradients, glass‑heavy panels, neon multi‑accent dashboards.
- Dense Material FAB stacks and overcrowded card grids (“startup bank app”).
- Arbitrary spacing, rainbow semantic fills for decoration.

Screens already modeled after this contract include expense detail (segment pills, hero card). Extend **new** finance flows by copying **those primitives**, not one‑off styling.

---

## Color tokens (`colors.tokens.ts`)

84 tokens, dark-first. Group → token → usage. All also available via Tailwind:
`bg-{token}`, `text-{token}`, `border-{token}`.

| Group           | Tokens                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Core**        | `black`, `white`, `background`                                                                  |
| **Surface**     | `surfaceBase` `surfaceElevated` `surfaceFloating` `surfaceRaised` `surfaceOverlay`              |
| **Surface alt** | `cardBackground` `modalBackground` `inputBackground` `sheetBackground` `navbarBackground`       |
| **Text**        | `textPrimary` `textSecondary` `textMuted` `textDisabled` `textInverse` `textOnAccent`           |
| **Icon**        | `iconPrimary` `iconSecondary` `iconMuted` `iconDisabled` `iconAccent`                           |
| **Border**      | `border` `borderSubtle` `borderStrong` `borderFocus` `borderDivider` `borderInteractive`        |
| **Interactive** | `interactive` `interactiveHover` `interactivePress` `interactiveDisabled`                       |
| **Accent**      | `accent` `accentPress` `accentSoft` `accentMuted`                                               |
| **State**       | `success` `error` `warning` `info` (+ `*Subtle`, `*Text`, `*Border` for each, `errorPress`)     |
| **Overlay**     | `overlay` `overlayStrong` `overlayMedium` `overlayHeavy` `scrim` `scrimHeavy` `glass`           |
| **Skeleton**    | `skeleton` `skeletonShimmer` `skeletonHighlight`                                                |
| **Misc**        | `placeholder` `cursor` `selection` `switch*` `activityIndicator` `ripple` `shadow` `shadowSoft` |

### Opacity scale (`colors.ts`)

```ts
export const opacity = {
  transparent: 0,
  faint: 0.08,
  subtle: 0.2,
  low: 0.38,
  medium: 0.6,
  high: 0.87,
  opaque: 1,
};
```

---

## Typography (`typography.tokens.ts` + `typography.ts`)

### Primitives

| Scale           | Range                                            |
| --------------- | ------------------------------------------------ |
| `fontSize`      | `2xs` (10) … `6xl` (64) — 12 steps               |
| `fontWeight`    | `thin`–`extrabold` (`100`–`800`)                 |
| `lineHeight`    | `none` (1) … `loose` (1.75) — multipliers        |
| `letterSpacing` | `tighter` (-0.8) … `widest` (1.2) — px           |
| `fontFamily`    | flat: `sans-{weight}`, `mono-{weight}`, `system` |

### `textStyles` — compound presets

Spread these onto `<Text style={...}/>` for ready-to-use typography. Each entry
sets `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, and `letterSpacing`
together.

| Family   | Variants                                        |
| -------- | ----------------------------------------------- |
| Display  | `displayLarge`, `displayMedium`, `displaySmall` |
| Heading  | `h1` `h2` `h3` `h4`                             |
| Body     | `bodyLarge` `body` `bodyMedium`                 |
| Labels   | `labelLarge` `label` `labelSmall`               |
| Caption  | `caption` `captionSmall`                        |
| Overline | `overline` (uppercase, tracked)                 |
| Button   | `buttonLarge` `button` `buttonSmall`            |
| Numeric  | `numericLarge` `numeric` (tabular)              |
| Code     | `codeLarge` `code` (mono)                       |

### NativeWind equivalents

```html
<Text className="text-2xl font-sans-bold leading-tight tracking-tight" />
<!-- ≡ <Text style={textStyles.h2} /> -->
```

---

## Spacing (`spacing.tokens.ts` + `spacing.ts`)

4-px base. Tailwind's defaults are **replaced** so `p-4 = 16px` (not `1rem`).

| Token    | Value | Tailwind | Notes                     |
| -------- | ----- | -------- | ------------------------- |
| `px`     | 1     | `p-px`   | hairline (borders only)   |
| `0.5`    | 2     | `p-0.5`  |                           |
| `1`      | 4     | `p-1`    |                           |
| `2`      | 8     | `p-2`    | default inline gap        |
| `3`      | 12    | `p-3`    | small component padding   |
| `4`      | 16    | `p-4`    | default component padding |
| `6`      | 24    | `p-6`    | card padding              |
| `8`      | 32    | `p-8`    | section gap               |
| **`11`** | 44    | `h-11`   | min touch target (HIG)    |
| `12`     | 48    | `p-12`   |                           |
| `16`     | 64    | `p-16`   |                           |

Plus semantic aliases in `space.*` (`screenPadding`, `sectionGap`,
`inputPadV/H`, etc.) and fixed `size.*` (`touchMin: 44`, `avatarLg: 48`,
`tabBarHeight: 56`, `iconLg: 32`, ...).

---

## Radius (`radius.tokens.ts` + `radius.ts`)

Both the geometric scale AND semantic aliases are exposed to Tailwind, so
`rounded-md`, `rounded-card`, and `rounded-modal` all work.

| Scale  | px   |     | Semantic       | px   |
| ------ | ---- | --- | -------------- | ---- |
| `none` | 0    |     | `tag`          | 4    |
| `xs`   | 4    |     | `button`       | 8    |
| `sm`   | 6    |     | `input`        | 8    |
| `md`   | 8    |     | `card`         | 12   |
| `lg`   | 12   |     | `cardLarge`    | 16   |
| `xl`   | 16   |     | `modal`        | 24   |
| `2xl`  | 24   |     | `avatar`       | 9999 |
| `3xl`  | 32   |     | `fab`/`toggle` | 9999 |
| `full` | 9999 |     | `notification` | 12   |

`radius.sheet` is nested for partial corners (`top` / `left` / `right`); all =
`24` for bottom sheets and side drawers. NativeWind equivalent:
`rounded-t-2xl` etc.

---

## Borders (`borders.tokens.ts` + `borders.ts`)

### Width scale

| Token      | px  | Use                       |
| ---------- | --- | ------------------------- |
| `none`     | 0   |                           |
| `hairline` | 0.5 | dividers, subtle outlines |
| `thin`     | 1   | standard borders          |
| `medium`   | 1.5 | focused state             |
| `thick`    | 2   | selected state            |
| `heavy`    | 3   | progress bars             |
| `bold`     | 4   | accent left edges         |

### Compound presets (`borders.*`)

`default` `strong` `focus` `selected` `disabled` `success` `successSubtle`
`error` `errorSubtle` `warning` `warningSubtle` `card` `input` `inputFocus`
`inputError` `inputSuccess` `divider` `dividerStrong` `tag` `tag*`
`accentLeft*` `dashed` `dashedSubtle`.

Spread directly: `<View style={[borders.input, { borderRadius: radius.input }]} />`.

---

## Shadows (`shadows.ts`)

Cross-platform shadow presets. RN's iOS shadow API and Android's `elevation`
do not map 1:1 — use `platformShadow(level)` to get the right shape per OS.

```ts
import { platformShadow, coloredShadow } from '@/theme';

<View style={[component.card.flat, platformShadow('md')]} />
<View style={coloredShadow.accent} />  // iOS-only glow
```

Levels: `xs` `sm` `md` `lg` `xl` `2xl`. Colored glow keys: `accent`, `error`,
`success`.

> **Tailwind shadows are intentionally not wired up.** Cross-platform fidelity
> requires platform branching that's awkward in NativeWind v4 — TS is the
> single API for shadows.

---

## Motion (`motion.ts`)

Each motion token exposes both a Reanimated config and a NativeWind class.

| Group           | Use                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `duration`      | `instant` `micro` `fast` `normal` `moderate` `slow` `slower` `crawl` `dramatic` (`{ ms, tw }`) |
| `easing`        | `standard` `enter` `exit` `emphasized` `linear` `bounce` (`{ bezier, tw, rn }`)                |
| `spring`        | `snappy` `bouncy` `gentle` `stiff` `wobbly` (Reanimated config)                                |
| `scale`         | `pressedLight` `pressed` `pressedHard` `expanded` `pop` (`{ value, tw }`)                      |
| `translate`     | `none` `xs` `sm` `md` `lg` `xl` `screen`                                                       |
| `motionOpacity` | `hidden` `faint` `subtle` `low` `medium` `high` `visible`                                      |
| `transition`    | semantic presets — `fadeIn` `slideUp` `pop` `press` `shimmer`                                  |

```tsx
// Press feedback
<Animated.View style={animatedScale}>
  <Pressable onPress={...} />
</Animated.View>
// equivalent NativeWind
<Pressable className="active:scale-95 duration-75 ease-out" />
```

---

## Component presets (`components.ts`)

Ready-to-spread style objects under `component.{name}`. Every primitive in
`src/components/ui` is a thin wrapper around one of these.

| Preset       | Sub-keys                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `button`     | `base`, `size.{sm,md,lg,icon,iconSm,iconLg}`, `{primary,secondary,ghost,outline,destructive,accent}.{resting,pressed,disabled,label}` |
| `input`      | `base`, `size.{sm,md,lg}`, `{resting,focus,error,success,disabled}`, `text`, `placeholder`, `label`, `helperText`, `errorText`        |
| `card`       | `flat` `raised` `elevated` `ghost` `interactive.{resting,pressed}` + `header` `body` `footer`                                         |
| `badge`      | `base`, `dot` `dotText`, `{default,success,error,warning,accent}.{container,text}`                                                    |
| `avatar`     | `base`, `size.*`, `initials.*`, `ring`                                                                                                |
| `divider`    | `horizontal` `horizontalStrong` `vertical` `withLabel` `label`                                                                        |
| `listItem`   | `base` `pressed` `leading` `content` `title` `subtitle` `trailing` `trailingText`                                                     |
| `modal`      | `backdrop` `sheet` `handle` `header` `title` `body` `dialog`                                                                          |
| `toast`      | `base` `{default,success,error,warning}` `title` `subtitle`                                                                           |
| `skeleton`   | `base` `line` `lineShort` `circle` `rect`                                                                                             |
| `screen`     | `base` `content` `contentNarrow` `contentWide` `centered`                                                                             |
| `emptyState` | `container` `icon` `title` `subtitle`                                                                                                 |

---

## Primitive components (`src/components/ui`)

Always prefer these over raw RN primitives.

| Component   | Backed by                 | Notes                                                                       |
| ----------- | ------------------------- | --------------------------------------------------------------------------- |
| `Text`      | `textStyles`, `colors`    | `variant` + `color` props                                                   |
| `Pressable` | RN Pressable + Reanimated | spring scale feedback (configurable / disable)                              |
| `Button`    | `component.button`        | 6 variants × 3 sizes + icon shapes, loading/disabled, left/right slots      |
| `Card`      | `component.card`          | 4 static variants + interactive (when `onPress`); `Card.Header/Body/Footer` |
| `Input`     | `component.input`         | label, helper, error, leftSlot/rightSlot, focus + error states              |
| `Skeleton`  | `component.skeleton`      | 4 variants, opacity-pulse animation                                         |
| `Avatar`    | `component.avatar`        | image with initials fallback, optional ring                                 |
| `Divider`   | `component.divider`       | horizontal/vertical, optional inline label                                  |
| `Badge`     | `component.badge`         | 5 variants; `<BadgeDot count={...} />` for counters                         |
| `Screen`    | `component.screen`        | top-level wrapper with width preset                                         |

```tsx
import {
  Avatar,
  Badge,
  BadgeDot,
  Button,
  Card,
  Divider,
  Input,
  Pressable,
  Screen,
  Skeleton,
  Text,
} from '@/components';
```

---

## `cn()` helper

`src/utils/cn.ts` — tiny conditional-class composer for NativeWind.

```tsx
import { cn } from '@/utils/cn';

<View
  className={cn(
    'p-4 rounded-card bg-surface',
    error && 'border border-error',
    pressed && 'opacity-80',
  )}
/>;
```

---

## Adding a new token

1. Add the raw value to the appropriate `*.tokens.ts`.
2. (If needed) Re-export or compose into the matching `*.ts` façade.
3. **Do nothing else.** Tailwind picks it up automatically because
   `tailwind.config.ts` imports the same file. `pnpm dev` regenerates classes
   on the next save.

```ts
// colors.tokens.ts
export const colors = {
  ...,
  brandTeal: '#3DDBD9',  // ← add token
};

// usage anywhere
<View className="bg-brandTeal" />
<Text style={{ color: colors.brandTeal }} />
```

---

## Conventions

- **No raw hex / px values in feature code.** Always go through a token.
- **Prefer primitive components over compound presets.** They handle press
  feedback, accessibility roles, and accessibility state for you.
- **Prefer compound presets over individual tokens.** A `<View style={[component.card.flat]} />`
  is one line; the equivalent assembled from `colors`, `radius`, `borders`,
  `padding` is six.
- **Prefer NativeWind utilities for layout / static styling.** Reach for raw
  TS tokens for dynamic values (animations, derived state).
- **Don't add new aliases without a clear semantic intent.** "Make the radius
  bigger here" → use the existing `radius.lg` (12). Don't invent `radius.xtraSnug`.

---

## Verifying token integrity

```bash
node scripts/verify-tailwind-config.mjs
```

Loads `tailwind.config.ts` through the same code path Tailwind uses
(jiti → `tailwindcss/loadConfig`) and prints the resolved counts:

```
{ colorsCount: 84, fontFamilyCount: 12, radiusCount: 25, spacing11: '44px' }
```
