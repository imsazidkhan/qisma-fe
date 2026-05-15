import { spacing as rawSpacing, zIndex as rawZIndex } from './spacing.tokens';

/**
 * Numeric scale (multiples of 4) used by every layout dimension.
 *
 * - `spacing["4"]` style keys mirror Tailwind / NativeWind utilities
 *   (`p-4`, `gap-3`, etc.).
 * - `xs/sm/md/lg/xl` aliases are kept for backward-compat with screens that
 *   still read `spacing.md`. Prefer the numeric keys (or NativeWind classes)
 *   in new code.
 */
export const spacing = {
  ...rawSpacing,

  // Legacy aliases (do not add new ones).
  xs: rawSpacing['1'],
  sm: rawSpacing['2'],
  md: rawSpacing['4'],
  lg: rawSpacing['6'],
  xl: rawSpacing['8'],
} as const;

/**
 * Named layout intents. Use these in components instead of raw scale values
 * whenever the spacing has semantic meaning ("screen padding", "section gap").
 *
 * **Finance screens:** prefer **`layoutGrid`** (`@/theme`) for the strict 8 × 8 pt
 * gutter (`inset` = 24 px horizontal rail). See `THEME.md` → Finance UI language.
 *
 * **Premium vertical rhythm** — prefer **8 · 12 · 16 · 24 · 32** (`gapSm` · `gap` ·
 * `gapMd` · `gapLg` · `gapXl` / `sectionGap`) for screen sections; avoid ad-hoc gaps.
 * Legacy: `gapXs` (4), `sectionGapLg` (40), `sectionGapXl` (48); use only when a token
 * already depends on them — new group-hub style should stay on the five-step scale.
 *
 * @example style={{ paddingHorizontal: space.screenPadding, gap: space.gap }}
 */
export const space = {
  // Inline gaps (between sibling elements)
  gapXs: rawSpacing['1'],
  gapSm: rawSpacing['2'],
  gap: rawSpacing['3'],
  gapMd: rawSpacing['4'],
  gapLg: rawSpacing['6'],
  gapXl: rawSpacing['8'],

  // Component internal padding
  paddingXs: rawSpacing['1.5'],
  paddingSm: rawSpacing['2'],
  padding: rawSpacing['4'],
  paddingMd: rawSpacing['5'],
  paddingLg: rawSpacing['6'],
  paddingXl: rawSpacing['8'],

  // Screen-level horizontal safe area
  screenPaddingSm: rawSpacing['4'],
  screenPadding: rawSpacing['5'],
  screenPaddingLg: rawSpacing['6'],

  // Vertical rhythm between sections on a screen
  sectionGapSm: rawSpacing['6'],
  sectionGap: rawSpacing['8'],
  sectionGapLg: rawSpacing['10'],
  sectionGapXl: rawSpacing['12'],

  // List / feed item spacing
  listItemGap: rawSpacing.px,
  listItemPadV: rawSpacing['3'],
  listItemPadH: rawSpacing['4'],

  // Input
  inputPadH: rawSpacing['4'],
  inputPadV: rawSpacing['3'],
  inputGap: rawSpacing['2'],

  // Icon
  iconGap: rawSpacing['2'],
  iconGapSm: rawSpacing['1'],
} as const;

/**
 * Fixed dimensions for interactive elements.
 *
 * - `touchMin` (44) matches the Apple HIG / Material minimum tappable target.
 * - For NativeWind, prefer `h-11` etc. (which resolves via the spacing scale)
 *   when the value happens to map cleanly. Use these tokens for absolute
 *   numbers in `StyleSheet`.
 */
export const size = {
  touchMin: 44,

  inputSm: 36,
  input: 48,
  inputLg: 56,

  buttonSm: 32,
  button: 44,
  buttonLg: 52,

  iconXs: 12,
  /** Ledger footer clock glyph (~14 dp). */
  expenseLedgerFooterClock: 14,
  iconSm: 16,
  icon: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  avatarXs: 24,
  avatarSm: 32,
  avatar: 40,
  avatarLg: 48,
  avatarXl: 64,
  avatarDisplay: 96,

  thumbSm: 48,
  thumb: 64,
  thumbLg: 80,
  thumbXl: 120,

  tabBarHeight: 56,
  headerHeight: 56,
  bottomSheetHandle: 4,

  hairline: 1,
} as const;

/**
 * RN `zIndex` only orders siblings — use these to document layering intent
 * across the app so different screens stay consistent.
 */
export const zIndex = rawZIndex;

export type Spacing = typeof spacing;
export type Space = typeof space;
export type Size = typeof size;
export type ZIndex = typeof zIndex;

/**
 * Strict **finance screen grid** — multiples of `4` px (pairs align to **8 pt** rhythm).
 * Use for split‑expense / hub surfaces so header, tabs, cards, and rails share one gutter.
 *
 * | Step    | px | Role |
 * | ------- | -- | ---- |
 * | `micro` | 8  | Tight stacks, chip gaps |
 * | `sm`    | 16 | Default sibling gaps |
 * | `inset` | 24 | Horizontal screen gutter **and** standard card interior |
 * | `section` | 32 | Vertical rhythm between major blocks |
 * | `major` | 40 | Footer / rare large separation |
 *
 * Prefer **`layoutGrid.inset`** for `paddingHorizontal` on scroll content so tabs align with cards.
 */
export const layoutGrid = {
  micro: rawSpacing['2'],
  sm: rawSpacing['4'],
  inset: rawSpacing['6'],
  section: rawSpacing['8'],
  major: rawSpacing['10'],
} as const;

export type LayoutGrid = typeof layoutGrid;
