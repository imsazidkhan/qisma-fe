import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Shadow elevation scale.
 *
 * RN splits shadows across two platform APIs:
 * - **iOS** uses `shadowColor` + `shadowOffset` + `shadowOpacity` + `shadowRadius`.
 * - **Android** uses a single integer `elevation`.
 *
 * Each level here defines all five fields so consumers can spread directly.
 * For the platform-correct subset (no no-op props on the wrong platform),
 * call `platformShadow(level)` instead.
 *
 * On a near-black background, shadows are nearly invisible. Prefer tonal
 * contrast (`surfaceBase` → `surfaceElevated` → `surfaceRaised`) for most
 * elevation, and reserve shadows for floating elements (sheets, toasts, FAB).
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.36,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 16,
  },
  /**
   * Premium card (large radius) — soft ambient blur, lower opacity than `sm`/`md`.
   * Pair with `premiumCardSurface` + `radius.inviteCard` (~28).
   */
  premiumCard: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.11,
    shadowRadius: 28,
    elevation: 5,
  },
} as const satisfies Record<string, ViewStyle>;

export type ShadowLevel = keyof typeof shadows;

/**
 * Returns only the platform-relevant shadow props for `level`.
 * On iOS: shadowColor / shadowOffset / shadowOpacity / shadowRadius.
 * On Android: elevation. (Web returns the iOS-style props.)
 *
 * @example
 *   <View style={[styles.card, platformShadow('md')]} />
 */
export function platformShadow(level: ShadowLevel): ViewStyle {
  const s = shadows[level];
  if (Platform.OS === 'android') {
    return { elevation: s.elevation };
  }
  return {
    shadowColor: s.shadowColor,
    shadowOffset: s.shadowOffset,
    shadowOpacity: s.shadowOpacity,
    shadowRadius: s.shadowRadius,
  };
}

/**
 * Colored shadow / glow effect — iOS only.
 *
 * Android's `elevation` ignores `shadowColor` (system always renders a gray
 * shadow). On Android, simulate a glow with a soft accent border or a tinted
 * surface behind the element instead.
 *
 * @example
 *   <Pressable style={[styles.fab, coloredShadow.accent]} />
 */
export const coloredShadow = {
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  error: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  warning: {
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export type Shadows = typeof shadows;
export type ColoredShadow = typeof coloredShadow;
