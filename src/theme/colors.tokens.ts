/**
 * Brand color tokens.
 *
 * `colors`        — DARK palette (also the Tailwind/NativeWind source of truth
 *                    consumed by `tailwind.config.ts`). Static utilities like
 *                    `bg-background` resolve to these dark values.
 * `colorsLight`   — LIGHT palette, structurally identical (every key in `colors`
 *                    has a counterpart). Theme-aware components subscribe via
 *                    `useThemeColors()` (see `src/theme/ThemeProvider.tsx`) and
 *                    receive whichever palette is active at runtime.
 *
 * Both palettes stay monochrome / industrial — only the tonal value flips.
 * **Accent:** dark mode uses electric lime on near-black; light mode uses
 * ink (`#0A0A0A`) so primary chrome stays restrained on paper-bright surfaces.
 * Filled accent controls pair with `textOnAccent` (ink on lime in dark,
 * near-white on ink in light).
 */
export const colors = {
  // CORE
  black: '#000000',
  white: '#FFFFFF',

  // BACKGROUNDS
  background: '#000000',
  /** Cool charcoal vertical wash — pairs with `canvasGradientEnd` for screen depth. */
  canvasGradientStart: '#070709',
  canvasGradientEnd: '#121018',

  surfaceBase: '#0A0A0A',
  surfaceElevated: '#121212',
  surfaceFloating: '#1A1A1A',
  surfaceRaised: '#242424',
  surfaceOverlay: '#343434',

  navbarBackground: '#000000',
  cardBackground: '#121212',
  modalBackground: '#1A1A1A',
  inputBackground: '#0F0F0F',
  sheetBackground: '#161616',
  /** Premium floating panels — soft tint, not flat `sheetBackground`. */
  premiumCardSurface: '#141414',

  // Backward compatibility (numeric variants).
  surface: '#0A0A0A',
  surface2: '#121212',
  surface3: '#1A1A1A',

  // TEXT
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1A1',
  textMuted: '#7A7A7A',
  textDisabled: '#525252',

  textInverse: '#000000',
  textOnAccent: '#0A0A0A', // ink on lime-filled CTAs

  textLabel: '#BDBDBD',
  textMono: '#D6D6D6',

  // ICONS / GLYPHS
  glyph: '#FFFFFF',

  iconPrimary: '#FFFFFF',
  iconSecondary: '#A1A1A1',
  iconMuted: '#7A7A7A',
  iconDisabled: '#525252',
  iconAccent: '#D7FF64',

  // BORDERS
  borderSubtle: '#1F1F1F',
  border: '#242424',
  borderStrong: '#343434',
  borderFocus: '#D7FF64',

  borderDivider: '#1A1A1A',
  borderInteractive: '#3A3A3A',

  // INTERACTIVE
  interactive: '#1A1A1A',
  interactiveHover: '#242424',
  interactivePress: '#343434',
  interactiveDisabled: '#111111',

  // ACCENT
  accent: '#D7FF64',
  accentPress: '#C2E657', // ~10% darker — pressed / active state
  accentSoft: 'rgba(215,255,100,0.14)', // aligned with light for chips / glows
  accentMuted: '#A8C95A',

  // STATES
  success: '#D7FF64',
  successSubtle: 'rgba(215,255,100,0.10)',
  successText: '#D7FF64',
  successBorder: '#D7FF64',

  error: '#FF5A5A',
  errorPress: 'rgba(255,90,90,0.18)', // pressed state for destructive surfaces
  errorSubtle: 'rgba(255,90,90,0.10)',
  errorText: '#FF5A5A',
  errorBorder: '#FF5A5A',

  warning: '#FFE66D',
  warningSubtle: 'rgba(255,230,109,0.10)',
  warningText: '#FFE66D',
  warningBorder: '#FFE66D',

  info: '#FFFFFF',
  infoSubtle: 'rgba(255,255,255,0.08)',
  infoText: '#FFFFFF',
  infoBorder: '#FFFFFF',

  // OVERLAYS
  overlay: 'rgba(255,255,255,0.04)',
  overlayStrong: 'rgba(255,255,255,0.08)',
  overlayMedium: 'rgba(255,255,255,0.12)',
  overlayHeavy: 'rgba(255,255,255,0.18)',

  scrim: 'rgba(0,0,0,0.60)',
  scrimHeavy: 'rgba(0,0,0,0.80)',

  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(255,255,255,0.10)',

  // SKELETON
  skeleton: '#121212',
  skeletonShimmer: '#1A1A1A',
  skeletonHighlight: '#242424',

  // SHADOWS
  shadow: 'rgba(0,0,0,0.80)',
  shadowSoft: 'rgba(0,0,0,0.40)',

  // COMPONENT PROPS
  placeholder: '#6B6B6B',
  cursor: '#FAFAFA',
  selection: '#D7FF64',

  switchTrackOn: '#D7FF64',
  switchTrackOff: '#343434',
  switchThumb: '#FFFFFF',

  activityIndicator: '#D7FF64',

  ripple: 'rgba(255,255,255,0.08)',

  statusBarLight: '#FFFFFF',
  statusBarDark: '#000000',

  /**
   * **Group hub** — social-first detail surfaces (cool charcoal + indigo accent).
   * Use in group detail / invite-safe preview; keeps spend UI visually separate.
   */
  groupHubBackground: '#0F1115',
  groupHubCard: '#171A20',
  groupHubBorder: 'rgba(152,162,179,0.14)',
  groupHubMuted: '#98A2B3',
  groupHubAccent: '#7C8CFF',
  groupHubAccentPress: '#6B7AE8',
  groupHubAccentSoft: 'rgba(124,140,255,0.20)',
  groupHubCtaGlow: 'rgba(124,140,255,0.42)',
  /** Pastel fills for overlapping member chips (solid “gradient” look). */
  socialRing0: '#2A3555',
  socialRing1: '#3D2F4F',
  socialRing2: '#1E4A5C',
  socialRing3: '#4A3044',
  socialRing4: '#274A45',

  /**
   * **Invite / add-members sheet** — social-first surfaces (light = airy gray canvas).
   */
  inviteCanvas: '#0F1115',
  inviteSurface: '#171A20',
  inviteBorder: 'rgba(152,162,179,0.14)',
  inviteMuted: '#98A2B3',
  inviteAccent: '#7C8CFF',
  inviteAccentSoft: 'rgba(124,140,255,0.16)',
  inviteSegmentTrack: 'rgba(255,255,255,0.06)',
  inviteSuccess: '#34D399',
  inviteSuccessFg: '#FFFFFF',
  inviteSuccessSoft: 'rgba(52,211,153,0.22)',
} as const;

/**
 * Light palette. Structurally mirrors `colors` (dark) — every key exists in
 * both, so consumers can swap palettes via `useThemeColors()` without
 * conditional access. Designed to feel like premium hardware in daylight:
 * near-white surfaces, ink-black text, hairline gray borders, no chrome.
 *
 * Typed as `Record<keyof typeof colors, string>` rather than `typeof colors`
 * to keep key parity (compile-time guarantee that every key from the dark
 * palette is present) without forcing the *values* to match the dark
 * palette's `as const` string literals.
 */
export const colorsLight: Record<keyof typeof colors, string> = {
  // CORE
  black: '#000000',
  white: '#FFFFFF',

  // BACKGROUNDS
  background: '#F4F4F4',
  /** Warm paper vertical wash — avoids flat slab gray on light canvases. */
  canvasGradientStart: '#F7F5F1',
  canvasGradientEnd: '#EDEAE3',

  surfaceBase: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  surfaceFloating: '#F5F5F5',
  surfaceRaised: '#EFEFEF',
  surfaceOverlay: '#E5E5E5',

  navbarBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  modalBackground: '#FAFAFA',
  inputBackground: '#FFFFFF',
  sheetBackground: '#FAFAFA',
  premiumCardSurface: '#EBEBEB',

  surface: '#FFFFFF',
  surface2: '#FAFAFA',
  surface3: '#F5F5F5',

  // TEXT — tuned for contrast on #F4F4F4 / white (older greys read as a washed-out veil).
  textPrimary: '#0A0A0A',
  textSecondary: '#454545',
  textMuted: '#5E5E5E',
  textDisabled: '#B5B5B5',

  textInverse: '#FFFFFF',
  /** Filled `accent` slab label: ink on lime (dark), near-white on ink (light). */
  textOnAccent: '#FAFAFA',

  textLabel: '#3F3F3F',
  textMono: '#2A2A2A',

  // ICONS / GLYPHS
  glyph: '#000000',

  iconPrimary: '#000000',
  iconSecondary: '#454545',
  iconMuted: '#5E5E5E',
  iconDisabled: '#B5B5B5',
  iconAccent: '#0A0A0A',

  // BORDERS
  borderSubtle: '#EAEAEA',
  border: '#DCDCDC',
  borderStrong: '#BFBFBF',
  borderFocus: '#0A0A0A',

  borderDivider: '#E5E5E5',
  borderInteractive: '#C8C8C8',

  // INTERACTIVE
  interactive: '#F5F5F5',
  interactiveHover: '#EFEFEF',
  interactivePress: '#E5E5E5',
  interactiveDisabled: '#FAFAFA',

  // ACCENT — ink on light surfaces (lime reserved for dark mode)
  accent: '#0A0A0A',
  accentPress: '#242424',
  accentSoft: 'rgba(10,10,10,0.08)',
  accentMuted: '#5E5E5E',

  // STATES
  success: '#1F7A1F',
  successSubtle: 'rgba(31,122,31,0.10)',
  successText: '#1F7A1F',
  successBorder: '#1F7A1F',

  error: '#D62F2F',
  errorPress: 'rgba(214,47,47,0.18)',
  errorSubtle: 'rgba(214,47,47,0.10)',
  errorText: '#B82323',
  errorBorder: '#D62F2F',

  warning: '#B7860B',
  warningSubtle: 'rgba(183,134,11,0.10)',
  warningText: '#9A7008',
  warningBorder: '#B7860B',

  info: '#0A0A0A',
  infoSubtle: 'rgba(0,0,0,0.05)',
  infoText: '#0A0A0A',
  infoBorder: '#0A0A0A',

  // OVERLAYS — flip to dark-on-white in light mode
  overlay: 'rgba(0,0,0,0.04)',
  overlayStrong: 'rgba(0,0,0,0.08)',
  overlayMedium: 'rgba(0,0,0,0.12)',
  overlayHeavy: 'rgba(0,0,0,0.18)',

  scrim: 'rgba(0,0,0,0.40)',
  scrimHeavy: 'rgba(0,0,0,0.60)',

  glass: 'rgba(255,255,255,0.60)',
  glassStrong: 'rgba(255,255,255,0.80)',

  // SKELETON
  skeleton: '#EFEFEF',
  skeletonShimmer: '#E5E5E5',
  skeletonHighlight: '#FAFAFA',

  // SHADOWS — softer in light mode to avoid heavy ink slabs
  shadow: 'rgba(0,0,0,0.18)',
  shadowSoft: 'rgba(0,0,0,0.06)',

  // COMPONENT PROPS — placeholder must stay legible on white / #FAFAFA inputs.
  placeholder: '#5E5E5E',
  cursor: '#0A0A0A',
  selection: 'rgba(10,10,10,0.18)',

  switchTrackOn: '#0A0A0A',
  switchTrackOff: '#C8C8C8',
  switchThumb: '#FFFFFF',

  activityIndicator: '#0A0A0A',

  ripple: 'rgba(0,0,0,0.08)',

  statusBarLight: '#FFFFFF',
  statusBarDark: '#000000',

  groupHubBackground: '#EDEFF5',
  groupHubCard: '#FFFFFF',
  groupHubBorder: 'rgba(15,17,21,0.09)',
  groupHubMuted: '#5C6678',
  groupHubAccent: '#5C6FD6',
  groupHubAccentPress: '#4E5FC4',
  groupHubAccentSoft: 'rgba(92,111,214,0.14)',
  groupHubCtaGlow: 'rgba(92,111,214,0.32)',
  socialRing0: '#D8DCF0',
  socialRing1: '#E5D8F0',
  socialRing2: '#CFE5ED',
  socialRing3: '#F0D8E8',
  socialRing4: '#D0E8E3',

  inviteCanvas: '#F7F8FA',
  inviteSurface: '#FFFFFF',
  inviteBorder: '#EAECEF',
  inviteMuted: '#98A2B3',
  inviteAccent: '#6366F1',
  inviteAccentSoft: 'rgba(99,102,241,0.10)',
  inviteSegmentTrack: '#EEF0F4',
  inviteSuccess: '#059669',
  inviteSuccessFg: '#FFFFFF',
  inviteSuccessSoft: 'rgba(5,150,105,0.14)',
};
