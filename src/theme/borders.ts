import type { ViewStyle } from 'react-native';

import { colors } from './colors';
import { borderWidth as rawBorderWidth } from './borders.tokens';

/** Border thickness scale (px). Also exposed to Tailwind as `border-{key}`. */
export const borderWidth = rawBorderWidth;

/** RN-compatible border style values. */
export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
} as const satisfies Record<string, ViewStyle['borderStyle']>;

/**
 * Semantic border colors. Pulled from the `colors` palette so changing the
 * brand updates borders automatically. Never hard-code border colors in
 * components — pick a token here.
 */
export const borderColor = {
  // Tonal
  default: colors.border, // #242424 — resting state
  strong: colors.borderStrong, // #343434 — hover / selected
  focus: colors.borderFocus, // #D7FF64 — keyboard focus ring

  // Semantic
  success: colors.success,
  error: colors.error,
  warning: colors.warning,

  // Subtle (tinted, for banners / callouts)
  successSubtle: colors.successSubtle,
  errorSubtle: colors.errorSubtle,
  warningSubtle: colors.warningSubtle,

  transparent: 'transparent',
} as const;

/**
 * Ready-to-spread border presets for `StyleSheet`.
 *
 * @example
 *   <View style={[borders.card, { borderRadius: radius.card }]} />
 *
 * Prefer NativeWind for one-offs:
 *   <View className="border-hairline border-border" />
 */
export const borders = {
  // Resting
  none: {
    borderWidth: borderWidth.none,
    borderColor: borderColor.transparent,
    borderStyle: borderStyle.solid,
  },
  default: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.default,
    borderStyle: borderStyle.solid,
  },
  strong: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.strong,
    borderStyle: borderStyle.solid,
  },

  // Interactive
  hover: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.strong,
    borderStyle: borderStyle.solid,
  },
  focus: {
    borderWidth: borderWidth.medium,
    borderColor: borderColor.focus,
    borderStyle: borderStyle.solid,
  },
  selected: {
    borderWidth: borderWidth.thick,
    borderColor: borderColor.focus,
    borderStyle: borderStyle.solid,
  },
  disabled: {
    // Hairline + transparent preserves layout while making the border invisible.
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.transparent,
    borderStyle: borderStyle.solid,
  },

  // Semantic
  success: {
    borderWidth: borderWidth.thin,
    borderColor: borderColor.success,
    borderStyle: borderStyle.solid,
  },
  successSubtle: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.successSubtle,
    borderStyle: borderStyle.solid,
  },
  error: {
    borderWidth: borderWidth.thin,
    borderColor: borderColor.error,
    borderStyle: borderStyle.solid,
  },
  errorSubtle: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.errorSubtle,
    borderStyle: borderStyle.solid,
  },
  warning: {
    borderWidth: borderWidth.thin,
    borderColor: borderColor.warning,
    borderStyle: borderStyle.solid,
  },
  warningSubtle: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.warningSubtle,
    borderStyle: borderStyle.solid,
  },

  // Component-specific
  card: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.default,
    borderStyle: borderStyle.solid,
  },
  input: {
    borderWidth: borderWidth.thin,
    borderColor: borderColor.default,
    borderStyle: borderStyle.solid,
  },
  inputFocus: {
    borderWidth: borderWidth.medium,
    borderColor: borderColor.focus,
    borderStyle: borderStyle.solid,
  },
  inputError: {
    borderWidth: borderWidth.medium,
    borderColor: borderColor.error,
    borderStyle: borderStyle.solid,
  },
  inputSuccess: {
    borderWidth: borderWidth.medium,
    borderColor: borderColor.success,
    borderStyle: borderStyle.solid,
  },

  // Dividers (single edge)
  divider: {
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: borderColor.default,
    borderStyle: borderStyle.solid,
  },
  dividerStrong: {
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: borderColor.strong,
    borderStyle: borderStyle.solid,
  },

  // Tags / chips
  tag: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.strong,
    borderStyle: borderStyle.solid,
  },
  tagSuccess: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.successSubtle,
    borderStyle: borderStyle.solid,
  },
  tagError: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.errorSubtle,
    borderStyle: borderStyle.solid,
  },
  tagWarning: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.warningSubtle,
    borderStyle: borderStyle.solid,
  },

  // Accent bars (single edge)
  accentLeft: {
    borderLeftWidth: borderWidth.bold,
    borderLeftColor: borderColor.focus,
    borderStyle: borderStyle.solid,
  },
  accentLeftError: {
    borderLeftWidth: borderWidth.bold,
    borderLeftColor: borderColor.error,
    borderStyle: borderStyle.solid,
  },
  accentLeftWarning: {
    borderLeftWidth: borderWidth.bold,
    borderLeftColor: borderColor.warning,
    borderStyle: borderStyle.solid,
  },

  // Dashed / dotted variants
  dashed: {
    borderWidth: borderWidth.thin,
    borderColor: borderColor.strong,
    borderStyle: borderStyle.dashed,
  },
  dashedSubtle: {
    borderWidth: borderWidth.hairline,
    borderColor: borderColor.default,
    borderStyle: borderStyle.dashed,
  },
} as const satisfies Record<string, ViewStyle>;

export type BorderWidth = typeof borderWidth;
export type BorderStyle = typeof borderStyle;
export type BorderColor = typeof borderColor;
export type Borders = typeof borders;
export type BorderPreset = keyof typeof borders;
