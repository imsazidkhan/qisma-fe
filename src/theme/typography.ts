import { Platform, type TextStyle } from 'react-native';

import {
  fontFamily as rawFontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from './typography.tokens';

/**
 * Designer-friendly nested view of `fontFamily` for use in TypeScript / RN
 * `StyleSheet`s. The flat keys live in `typography.tokens.js` for Tailwind.
 *
 * Replace the actual font names after loading via `expo-font`. Until those
 * fonts are loaded, RN gracefully falls back to the platform default.
 */
const fontFamily = {
  sans: {
    thin: rawFontFamily['sans-thin'],
    light: rawFontFamily['sans-light'],
    regular: rawFontFamily['sans-regular'],
    medium: rawFontFamily['sans-medium'],
    semiBold: rawFontFamily['sans-semibold'],
    bold: rawFontFamily['sans-bold'],
    extraBold: rawFontFamily['sans-extrabold'],
  },
  mono: {
    regular: rawFontFamily.mono,
    medium: rawFontFamily['mono-medium'],
    bold: rawFontFamily['mono-bold'],
  },
  // Platform-specific system fallback (resolved at runtime).
  system: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
} as const;

/**
 * Ready-to-spread compound text styles for `<Text style={...}/>`.
 * Each entry sets `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`,
 * and `letterSpacing` together so individual screens stay terse.
 *
 * @example
 *   <Text style={[textStyles.h1, { color: colors.textPrimary }]} />
 *
 * Prefer this for semantic content. For one-off composition, NativeWind
 * utilities are also wired up: `text-2xl font-sans-bold leading-tight tracking-tight`.
 */
export const textStyles = {
  // Display
  displayLarge: {
    fontFamily: fontFamily.sans.bold,
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['6xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displayMedium: {
    fontFamily: fontFamily.sans.bold,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displaySmall: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.sans.bold,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.lg * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Body
  bodyLarge: {
    fontFamily: fontFamily.sans.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.sans.regular,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels
  labelLarge: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.loose,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * lineHeight.loose,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.medium,
    lineHeight: fontSize['2xs'] * lineHeight.loose,
    letterSpacing: letterSpacing.wider,
  },

  // Caption / helper
  caption: {
    fontFamily: fontFamily.sans.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.loose,
    letterSpacing: letterSpacing.normal,
  },
  captionSmall: {
    fontFamily: fontFamily.sans.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.loose,
    letterSpacing: letterSpacing.normal,
  },

  // Overline (ALL CAPS label above a section)
  overline: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs * lineHeight.loose,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },

  // Buttons
  buttonLarge: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
  button: {
    fontFamily: fontFamily.sans.semiBold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
  buttonSmall: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },

  // Numeric / tabular (stats, prices, counters)
  numericLarge: {
    fontFamily: fontFamily.sans.bold,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['4xl'] * lineHeight.none,
    letterSpacing: letterSpacing.tighter,
  },
  numeric: {
    fontFamily: fontFamily.sans.medium,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.medium,
    lineHeight: fontSize['2xl'] * lineHeight.none,
    letterSpacing: letterSpacing.tight,
  },

  // Code / mono
  codeLarge: {
    fontFamily: fontFamily.mono.regular,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  code: {
    fontFamily: fontFamily.mono.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
} as const satisfies Record<string, TextStyle>;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
} as const;

export type Typography = typeof typography;
export type TextStyleKey = keyof typeof textStyles;
export type TextStyles = typeof textStyles;

/** @deprecated Use `typography.fontFamily` (or NativeWind utilities). */
export const Fonts = {
  sans: fontFamily.sans.regular,
  mono: fontFamily.mono.regular,
  rounded: fontFamily.sans.regular,
  serif: 'serif',
};
