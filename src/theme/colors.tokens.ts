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

  /** Expense detail thread tab canvas — graphite void behind conversation (~ #0B0B0C). */
  expenseDetailThreadCanvas: '#0B0B0C',

  /** Nothing-style floating thread composer (matte graphite shell ~ #151517). */
  threadComposerSurface: '#151517',
  threadComposerBorder: 'rgba(255,255,255,0.06)',
  threadComposerBorderFocus: 'rgba(255,255,255,0.14)',
  /** Top inner hairline luminance (~ inset 1px rgba(255,255,255,0.03)+). */
  threadComposerInsetLine: 'rgba(255,255,255,0.04)',
  threadComposerIcon: 'rgba(255,255,255,0.38)',
  threadComposerPlaceholder: 'rgba(255,255,255,0.42)',
  /** Send control — monochrome; avoid accent slabs on send. */
  threadComposerSendIdle: '#1C1C1E',
  threadComposerSendActive: '#2E2E32',

  /**
   * **Balances** — editorial screen canvas (warm paper in light, deep neutral in dark).
   */
  balancesCanvas: '#080807',

  /**
   * Hub ambient search — flush with `balancesCanvas` at rest; slight lift on focus.
   */
  ambientSearchFill: '#080807',
  ambientSearchFillFocused: 'rgba(255,255,255,0.07)',
  ambientSearchBorder: 'rgba(255,255,255,0)',
  ambientSearchBorderFocused: 'rgba(255,255,255,0.10)',
  ambientSearchPlaceholder: 'rgba(255,255,255,0.34)',
  ambientSearchFilterScrim: 'rgba(255,255,255,0)',

  /** Create-group primary CTA — ink slab on dark / light canvases. */
  createGroupCtaFill: '#000000',
  /** Label + glyphs on `createGroupCtaFill`. */
  createGroupCtaContent: '#FFFFFF',

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
  /** Thread message body — restrained vs `textPrimary` on graphite. */
  expenseThreadBubbleText: '#C4C4C6',

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
  /** Premium frosted panels / invite cards — spec-aligned neutral hairline on dark. */
  borderFrost: '#2A2A2A',

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

  /** Muted taxonomy washes for expense-feed rows — glanceable Splitwise-ish chips over Nothing OS mono. */
  expenseFeedCategoryTintFood: 'rgba(255,166,114,0.14)',
  expenseFeedCategoryIconFood: '#FFB890',
  expenseFeedCategoryTintTravel: 'rgba(130,164,242,0.16)',
  expenseFeedCategoryIconTravel: '#9FB6FA',
  expenseFeedCategoryTintShopping: 'rgba(214,174,247,0.14)',
  expenseFeedCategoryIconShopping: '#D4BDF5',
  expenseFeedCategoryTintEntertainment: 'rgba(255,150,209,0.13)',
  expenseFeedCategoryIconEntertainment: '#FFA7D9',
  expenseFeedCategoryTintDefault: 'rgba(124,140,255,0.14)',
  expenseFeedCategoryIconDefault: '#94A6FF',
  expenseFeedMetaChipSurface: 'rgba(152,162,179,0.10)',
  expenseFeedMetaChipBorder: 'rgba(152,162,179,0.18)',
  /** Expense wallet slab — optional top inner sheen (paired with horizontal fade). */
  expenseWalletInnerSheen: 'rgba(255,255,255,0.055)',
  /** Ledger hub section rail (“EXPENSES”) — muted uppercase ink. */
  expenseLedgerSectionInk: '#98989D',
  /** Compact ledger feed card — Wallet × Linear slab hairlines & copy tiers. */
  expenseLedgerCardHairline: 'rgba(255,255,255,0.038)',
  expenseLedgerCategoryDockBg: '#1C1E24',
  expenseLedgerCategoryHairline: '#2E3038',
  expenseLedgerSubtitleInk: '#98989E',
  expenseLedgerMetaInk: '#8E8E94',
  expenseLedgerFooterInk: '#929298',
  expenseLedgerFooterGlyph: '#9A9AA0',
  expenseLedgerChevron: '#7C7C82',
  expenseLedgerOverflowBubble: '#2A2C32',
  expenseLedgerOverflowInk: '#C4C4CA',
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

  /** Lastbench floating tab rail — idle/active ink + dock hairline (dark). */
  floatingTabInkIdle: '#98989D',
  floatingTabInkActive: '#FAFAFA',
  floatingTabRailHairline: '#2C2C2E',
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

  expenseDetailThreadCanvas: '#EFF0F4',

  threadComposerSurface: '#E8E8EA',
  threadComposerBorder: 'rgba(0,0,0,0.10)',
  threadComposerBorderFocus: 'rgba(0,0,0,0.20)',
  threadComposerInsetLine: 'rgba(255,255,255,0.55)',
  threadComposerIcon: 'rgba(10,10,10,0.38)',
  threadComposerPlaceholder: 'rgba(10,10,10,0.42)',
  threadComposerSendIdle: '#D8D8DA',
  threadComposerSendActive: '#0A0A0A',

  balancesCanvas: '#F6F6F4',

  /**
   * Hub ambient search — white slab on warm `balancesCanvas`; border/shadow on focus.
   */
  ambientSearchFill: '#FFFFFF',
  ambientSearchFillFocused: '#FFFFFF',
  ambientSearchBorder: 'rgba(0,0,0,0)',
  ambientSearchBorderFocused: 'rgba(0,0,0,0.055)',
  ambientSearchPlaceholder: 'rgba(10,10,10,0.30)',
  ambientSearchFilterScrim: 'rgba(0,0,0,0)',

  /** Create-group primary CTA — pure black anchor. */
  createGroupCtaFill: '#000000',
  /** Label + glyphs on `createGroupCtaFill`. */
  createGroupCtaContent: '#FFFFFF',

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
  expenseThreadBubbleText: '#454545',

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
  borderFrost: '#C8C8C8',

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

  /** Ledger-first hub canvas (~ #F5F6FA spec alignment). */
  groupHubBackground: '#F5F6FA',
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

  expenseFeedCategoryTintFood: 'rgba(234,118,62,0.12)',
  expenseFeedCategoryIconFood: '#EA580C',
  expenseFeedCategoryTintTravel: 'rgba(79,142,237,0.12)',
  expenseFeedCategoryIconTravel: '#2563EB',
  expenseFeedCategoryTintShopping: 'rgba(168,85,247,0.11)',
  expenseFeedCategoryIconShopping: '#9333EA',
  expenseFeedCategoryTintEntertainment: 'rgba(244,114,182,0.11)',
  expenseFeedCategoryIconEntertainment: '#DB2777',
  expenseFeedCategoryTintDefault: 'rgba(92,111,214,0.12)',
  expenseFeedCategoryIconDefault: '#5C6FD6',
  expenseFeedMetaChipSurface: 'rgba(15,23,42,0.05)',
  expenseFeedMetaChipBorder: 'rgba(15,23,42,0.08)',
  expenseWalletInnerSheen: 'rgba(255,255,255,0.62)',
  expenseLedgerSectionInk: '#7B7B82',
  expenseLedgerCardHairline: 'rgba(15,17,21,0.038)',
  expenseLedgerCategoryDockBg: '#FAFAFA',
  expenseLedgerCategoryHairline: '#F3F3F4',
  expenseLedgerSubtitleInk: '#7D7D82',
  expenseLedgerMetaInk: '#8A8A90',
  expenseLedgerFooterInk: '#9A9AA1',
  expenseLedgerFooterGlyph: '#A5A5AB',
  expenseLedgerChevron: '#B5B5BB',
  expenseLedgerOverflowBubble: '#F3F3F5',
  expenseLedgerOverflowInk: '#55555B',

  inviteCanvas: '#F5F5F3',
  inviteSurface: '#FAFAF8',
  inviteBorder: '#E7E7E2',
  inviteMuted: '#7A7974',
  inviteAccent: '#6366F1',
  inviteAccentSoft: 'rgba(99,102,241,0.10)',
  inviteSegmentTrack: '#EEF0F4',
  inviteSuccess: '#059669',
  inviteSuccessFg: '#FFFFFF',
  inviteSuccessSoft: 'rgba(5,150,105,0.14)',

  floatingTabInkIdle: '#8E8E93',
  floatingTabInkActive: '#111111',
  floatingTabRailHairline: '#F1F1F1',
};
