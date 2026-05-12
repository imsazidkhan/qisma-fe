# Design Rules

> The visual contract for Qisma. Derived from the **Nothing OS** design language —
> monochrome, industrial, minimal, technical, restrained, typography-first,
> tactile, high whitespace, calm motion.
>
> When in doubt: **remove, don't add.** Whitespace > separators. Type > chrome.

---

## 1. Design Identity

The UI must feel like:

- Nothing OS
- Premium hardware software
- Industrial minimalism
- Technical, futuristic interface

The UI must NOT feel like:

- Generic SaaS dashboard
- Material Design app
- Colorful startup landing page
- Gaming UI
- Social media app

These two lists are the highest authority. If a decision moves the UI toward
the second list, it's wrong — regardless of how clever or "modern" it looks.

---

## 2. Visual Rules

| Rule       | Do                                                                      | Don't                                   |
| ---------- | ----------------------------------------------------------------------- | --------------------------------------- |
| Background | Near-black (`bg-background`, `bg-surface*`)                             | Pure white screens, colored backgrounds |
| Hierarchy  | Semantic surfaces (`surfaceBase` → `surfaceOverlay`)                    | Random tints / opacities                |
| Elevation  | Thin borders (`border border-border`)                                   | Drop shadows for "depth"                |
| Components | Outlined by default                                                     | Filled-everywhere look                  |
| Separation | Whitespace                                                              | Dividers / hairlines everywhere         |
| Contrast   | Restrained — `textPrimary` on `surface*`, not white-on-pure-black slabs | Maximum contrast for everything         |
| Corners    | Conservative (`rounded-sm`, `rounded-md`, `rounded-card`)               | Pill-everything, full-radius cards      |

### Forbidden

- Colorful UI
- Gradients (unless the user explicitly requests them)
- Neumorphism
- Material Design styling (FABs, raised cards, ripples-as-feedback)
- Glassmorphism-heavy UI
- Random elevation shadows
- Decorative UI without function
- Oversized CTA buttons

---

## 3. Color Rules

**Never hardcode colors.** Always read from `@/theme` — and read it via the
**`useThemeColors()` hook** (see §4 below) so the value flips with the active
theme.

### Palette discipline

- **Monochrome only.** Both palettes are grayscale on a near-black or
  near-white base, never colourful.
- **`palette.accent` is rare** — reserved for:
  - Focus rings
  - The single primary action per screen
  - Selected state
  - Key status indicators
- The accent is **lime (`#D7FF64`) on dark, ink-black (`#0A0A0A`) on light** —
  read the token, never write code that assumes a specific hue.
- **Status colors** (`success`, `error`, `warning`, `info`) only signal real
  status — never decoration.
- **Subtle overlays** (`overlay`, `overlayStrong`, `glass`) replace colorful
  fills for hover / pressed / hover-card surfaces.

```tsx
// ❌ BAD
<View style={{ backgroundColor: '#1a1a1a' }} />
<View className="bg-purple-500" />
<Text style={{ color: '#fff' }}>...</Text>

// ❌ BAD — static `colors` import is dark-only, ignores theme switch
import { colors } from '@/theme';
<View style={{ backgroundColor: colors.surfaceElevated }} />

// ✅ GOOD — palette via the hook, flips on theme toggle
import { useThemeColors } from '@/theme';
const palette = useThemeColors();
<View style={{ backgroundColor: palette.surfaceElevated }} />
<Text style={{ color: palette.textPrimary }}>...</Text>
```

---

## 4. Theme Awareness — Light + Dark are non-negotiable

Every component, screen, and primitive we ship MUST render correctly in
both light and dark. The active palette is selected by `<ThemeProvider>`
(mounted at the app root) and resolves the user's preference of `system` /
`light` / `dark`.

### Rules

- **Always read colors via `useThemeColors()`** in components. The static
  `colors` named export is the **dark** palette — fine inside other token
  files (e.g. `theme/borders.ts` presets) but wrong inside JSX.
- Both palettes have **identical keys**. No `if (mode === 'dark')` branching;
  no fallback values; no conditional access.
- For Reanimated `useAnimatedStyle`, pass palette colours as the
  **second-arg deps** so the animated style re-evaluates on theme swap:

  ```tsx
  const palette = useThemeColors();
  const style = useAnimatedStyle(
    () => ({
      borderColor: interpolateColor(progress.value, [0, 1], [palette.border, palette.borderFocus]),
    }),
    [palette.border, palette.borderFocus],
  );
  ```

- Static layout in `StyleSheet.create`; layer palette-dependent properties
  as inline overrides on the JSX:

  ```tsx
  <Text style={[styles.title, { color: palette.textPrimary }]}>...</Text>
  ```

  Inline styles are otherwise discouraged — palette overrides are the
  explicit exception.

- Status bar tint, splash chrome, and any platform-level chrome must derive
  from `useThemeMode()` (`'light' | 'dark'`).
- Switch a user's preference with `useThemePreference()` — the in-app
  `ThemeToggle` (`@/components/ui`) is the canonical UI for this.

### NativeWind colour caveat

`bg-background`, `text-textPrimary`, etc. resolve to the **dark** palette
only today (Tailwind config consumes the dark tokens). Until we wire
NativeWind's `dark:` variants:

- ❌ **Don't** use NativeWind utility classes for theme-sensitive surfaces
  (backgrounds, text colour, borders).
- ✅ **Do** use NativeWind for layout-only utilities — `flex-*`, `p-*`,
  `gap-*`, `rounded-*`, `border` width-only.

### Verification

Before merging any new screen or component, **toggle through `AUTO`,
`LIGHT`, and `DARK`** on the auth screen (or wherever `ThemeToggle` is
mounted) and confirm:

- No hardcoded colours leak through.
- Contrast is acceptable in both modes.
- Borders, focus rings, and status indicators all swap with the palette.
- No layout shift between modes.

---

## 5. Typography Rules

Typography is the **primary visual element** of the app. Most "design problems"
are solved by getting type right and removing chrome.

### Font usage

| Use case                                                                                  | Font             | Token                                                                     |
| ----------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| Body, UI text, headings                                                                   | Sans             | `textStyles.body`, `h1`–`h4`, `display*`                                  |
| Labels, metadata, timestamps, IDs, counters, version numbers, status text, technical info | **Mono**         | `textStyles.code`, `textStyles.codeLarge`, `typography.fontFamily.mono.*` |
| System labels (section headers, eyebrows)                                                 | Sans uppercase   | `textStyles.overline` (already `uppercase` + `tracking-widest`)           |
| Numbers in clocks, prices, stats, counters                                                | Tabular numerics | `textStyles.numeric`, `textStyles.numericLarge`                           |

### Weight & size

- Large headings use **restrained weight** — prefer `semiBold` (600) over
  `bold` (700) for display sizes. Reserve `bold` for true emphasis only.
- Avoid overly bold typography across the board.
- Inconsistent type scales are forbidden — only sizes from
  `typography.tokens.ts` (`fontSize.xs` … `fontSize['6xl']`).

### Examples

```tsx
// metadata / system label
<Text className="font-mono text-xs uppercase tracking-widest text-textMuted">
  v1.0.0 · BUILD 240
</Text>

// section eyebrow
<Text style={textStyles.overline}>Account</Text>

// heading — restrained weight
<Text style={textStyles.h1}>Settings</Text>

// stat — tabular
<Text style={textStyles.numericLarge}>42</Text>
```

---

## 6. Spacing Rules

- **Strict spacing scale only.** Use `spacing.*` tokens or NativeWind
  utilities (`p-4`, `gap-6`, `mt-2`) — they map to the same scale.
- **Respect the 8pt grid.** The spacing scale is built on it.
- Layouts are **spacious and intentional**. Generous `gap-*` between sections.
- Avoid dense UI — Nothing OS breathes.

### Forbidden

- Arbitrary spacing in any form:
  - `style={{ padding: 13 }}`
  - `className="p-[7px]"`
  - `marginTop: 9`
- Cramming multiple controls onto one line "to save space."

---

## 7. Component Rules

- **Always reuse existing primitives** in `@/components/ui`:
  - `Button`, `Input`, `Card`, `Text`, `Pressable`, `Avatar`, `Badge`,
    `Divider`, `Screen`, `Skeleton`
- Keep components **minimal**. Composition > nesting.
- No unnecessary decorations.
- No excessive shadows.
- **Outlined Button variants by default.** Filled is reserved for the single
  primary action on a screen.
- Don't reinvent primitives — extend them via props or composition.

---

## 8. Motion Rules

Motion is **mechanical and calm**. Use motion tokens from `@/theme`.

- Subtle fade & slide transitions only.
- **No bounce. No playful springs.** Prefer `transition.standard` /
  `easing.standard`.
- Restrained durations:
  - `duration.fast` — micro-interactions (button press, hover)
  - `duration.standard` — UI changes (toggles, state)
  - `duration.slow` — full-screen / page transitions only
- Animate only what serves comprehension or feedback.

```tsx
import { duration, easing } from '@/theme';

withTiming(1, { duration: duration.standard, easing: easing.standard });
```

### Forbidden

- Cartoon animations
- Exaggerated spring effects
- Parallax for its own sake
- Bouncy / playful eases on functional UI

---

## 9. Code Rules (design-adjacent)

- **Never hardcode** colors, spacing, font sizes, radii, font weights.
- **Always import from `@/theme`.** For colours, use `useThemeColors()` —
  the static `colors` named export is the dark palette and won't follow
  theme switches.
- Keep components scalable — prefer props + variants over copy-pasted
  near-duplicates.
- Follow existing architecture (see `qisma/src/theme/THEME.md` and the
  feature-slice structure under `src/features/`).
- Use TypeScript strictly. No `any`. Handle `undefined` from arrays/records
  (we use `noUncheckedIndexedAccess`).
- **Avoid inline styles** when expressible as NativeWind utilities or theme
  tokens. Palette overrides from `useThemeColors()` are the explicit
  exception.

---

## 10. Forbidden, in one place

- Random hex colors
- Arbitrary spacing values
- Colorful gradients
- Glassmorphism-heavy UI
- Oversized CTA buttons
- Cartoon animations
- Inconsistent typography
- Material UI patterns (FABs, ripples-as-affordance, raised cards)
- Random elevation shadows
- Decorative UI without function
- Static `colors.X` references inside JSX (use `useThemeColors()` instead)
- NativeWind colour utilities for theme-sensitive surfaces
- Components that haven't been verified in BOTH light and dark modes

---

## 11. UI Generation Checklist

Before merging any new screen or component, check:

1. **Tokens only.** No hex, no px, no arbitrary values. Everything resolves to `@/theme`.
2. **Theme-aware.** Colours come from `useThemeColors()` — verify the screen looks right in BOTH light and dark by toggling `AUTO / LIGHT / DARK` in `ThemeToggle`. No layout shift, no contrast failures, no hardcoded hue assumptions.
3. **Nothing-style match.** Monochrome surfaces, thin borders, generous whitespace, mono labels for metadata.
4. **Type & space first.** Hierarchy comes from typography and spacing — not colour, not shadows.
5. **Primitives reused.** Did you use `@/components/ui`? Did you avoid reinventing Button / Input / Card?
6. **Subtract once.** Pick one decoration (divider, shadow, colour, icon) and ask: does this earn its place? If not, delete it.

---

## 12. Source-of-truth links

- Theme system overview: [`src/theme/THEME.md`](../src/theme/THEME.md)
- Theme provider & hooks (`useThemeColors`, `useThemeMode`, `useThemePreference`): [`src/theme/ThemeProvider.tsx`](../src/theme/ThemeProvider.tsx)
- Tokens (single source for Tailwind + TS):
  - `src/theme/colors.tokens.ts` — `colors` (dark) + `colorsLight`
  - `src/theme/typography.tokens.ts`
  - `src/theme/spacing.tokens.ts`
  - `src/theme/radius.tokens.ts`
  - `src/theme/borders.tokens.ts`
- Motion tokens: `src/theme/motion.ts`
- Theme toggle UI: [`src/components/ui/ThemeToggle.tsx`](../src/components/ui/ThemeToggle.tsx)
- Cursor agent rules: [`../.cursorrules`](../.cursorrules)
