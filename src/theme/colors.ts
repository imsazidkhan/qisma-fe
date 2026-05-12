import { colors, colorsLight } from './colors.tokens';

/** DARK palette — also the Tailwind/NativeWind source of truth. */
export { colors, colorsLight };

/** Resolved color mode — `light` or `dark`. */
export type ColorMode = 'light' | 'dark';

/** Lookup table from `ColorMode` → palette. */
export const colorsByMode = {
  dark: colors,
  light: colorsLight,
} as const;

/**
 * Plain (non-hook) accessor for the palette of a given mode. Use the
 * `useThemeColors()` hook in components — this helper is for places where
 * hooks aren't available (e.g. inside other utilities or static config).
 */
export function getColors(mode: ColorMode) {
  return colorsByMode[mode];
}

/**
 * Numeric opacity scale used as the `opacity` style value (and for
 * "disabled / muted" states). Distinct from `motionOpacity` which couples
 * each level with NativeWind utility classes for animation purposes.
 */
export const opacity = {
  transparent: 0,
  faint: 0.08,
  subtle: 0.2,
  low: 0.38,
  medium: 0.6,
  high: 0.87,
  opaque: 1,
} as const;

export type OpacityToken = keyof typeof opacity;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];

/**
 * Legacy palette shape consumed by existing screens via
 * `Colors[useColorScheme() ?? 'light']`.
 *
 * The brand is dark-first, so both schemes resolve to the same token set.
 * Prefer importing `colors` (or NativeWind utilities) in new code.
 */
type LegacyPalette = {
  text: ColorValue;
  background: ColorValue;
  tint: ColorValue;
  icon: ColorValue;
  tabIconDefault: ColorValue;
  tabIconSelected: ColorValue;
};

const palette: LegacyPalette = {
  text: colors.textPrimary,
  background: colors.background,
  tint: colors.accent,
  icon: colors.iconSecondary,
  tabIconDefault: colors.iconMuted,
  tabIconSelected: colors.accent,
};

export const Colors = {
  light: palette,
  dark: palette,
} as const satisfies Record<'light' | 'dark', LegacyPalette>;
