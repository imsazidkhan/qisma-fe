import { Platform, type ViewStyle } from 'react-native';

import { type ColorMode, useThemeMode } from '@/theme';

/**
 * Emotional “luxury split” layer — additive to Qisma. Values follow the Split Expense
 * product brief while keeping dark/light pairs so the screen respects system theme.
 */
export type SplitLuxuryPalette = Readonly<{
  canvas: string;
  canvasEnd: string;
  card: string;
  selectorSurface: string;
  rowSurface: string;
  glassFallback: string;
  glassBorder: string;
  accent: string;
  accentMuted: string;
  accentTintFill: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  paidBg: string;
  paidText: string;
  borderHairline: string;
  dashedBorder: string;
  shadowIos: string;
  /** Chevron rotation state is handled in UI — token for collapsed chevron tint */
  iconMuted: string;
  /** Initials on dark glossy avatar */
  avatarInitials: string;
  avatarGradientEnd: string;
}>;

export const splitLuxuryPaletteLight = {
  canvas: '#F6F6F4',
  canvasEnd: '#EDECE8',
  card: '#FFFFFF',
  selectorSurface: '#F3F3F2',
  rowSurface: '#FAFAFA',
  glassFallback: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(0,0,0,0.06)',
  accent: '#7C6EF6',
  accentMuted: '#9F94F9',
  accentTintFill: 'rgba(124,110,246,0.08)',
  textPrimary: '#111111',
  textSecondary: '#3C3C3C',
  textMuted: '#7A7A7A',
  paidBg: 'rgba(52,199,89,0.12)',
  paidText: '#34C759',
  borderHairline: 'rgba(0,0,0,0.06)',
  dashedBorder: 'rgba(124,110,246,0.42)',
  shadowIos: '#000000',
  iconMuted: '#8E8E8E',
  avatarInitials: '#FAFAFA',
  avatarGradientEnd: '#2A2A2A',
} as const satisfies SplitLuxuryPalette;

export const splitLuxuryPaletteDark = {
  canvas: '#0E0E0D',
  canvasEnd: '#121211',
  card: '#181817',
  selectorSurface: '#1F1F1D',
  rowSurface: '#222221',
  glassFallback: 'rgba(38,37,36,0.92)',
  glassBorder: 'rgba(255,255,255,0.08)',
  accent: '#A69BFF',
  accentMuted: '#8C81F0',
  accentTintFill: 'rgba(166,155,255,0.09)',
  textPrimary: '#F6F6F4',
  textSecondary: '#D1D1CC',
  textMuted: '#9A9893',
  paidBg: 'rgba(92,222,125,0.12)',
  paidText: '#5CDE7D',
  borderHairline: 'rgba(255,255,255,0.07)',
  dashedBorder: 'rgba(166,155,255,0.42)',
  shadowIos: '#000000',
  iconMuted: '#8B8984',
  avatarInitials: '#F6F6F4',
  avatarGradientEnd: '#000000',
} as const satisfies SplitLuxuryPalette;

function pickLuxury(mode: ColorMode): SplitLuxuryPalette {
  return mode === 'light' ? splitLuxuryPaletteLight : splitLuxuryPaletteDark;
}

export function useSplitLuxuryPalette(): SplitLuxuryPalette {
  return pickLuxury(useThemeMode());
}

export function luxuryAmbientCardShadow(p: SplitLuxuryPalette): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: p.shadowIos,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.07,
        shadowRadius: 32,
      },
      default: {
        elevation: 4,
        shadowColor: p.shadowIos,
        shadowOpacity: 0.12,
      },
    }) ?? {}
  );
}

export function luxuryInnerRowShadow(_p: SplitLuxuryPalette): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      default: {
        elevation: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
      },
    }) ?? {}
  );
}
