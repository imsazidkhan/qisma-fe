/**
 * Typography primitives — single source of truth shared with Tailwind.
 *
 * `fontFamily` is intentionally flat so each weight maps to a Tailwind utility
 * class (`font-sans-bold`, `font-mono-medium`, ...). The nested view used by
 * `textStyles` lives in `typography.ts`.
 */
export const fontFamily = {
  system: 'System',

  sans: 'Inter-Regular',
  'sans-thin': 'Inter-Thin',
  'sans-light': 'Inter-Light',
  'sans-regular': 'Inter-Regular',
  'sans-medium': 'Inter-Medium',
  'sans-semibold': 'Inter-SemiBold',
  'sans-bold': 'Inter-Bold',
  'sans-extrabold': 'Inter-ExtraBold',

  mono: 'JetBrainsMono-Regular',
  'mono-medium': 'JetBrainsMono-Medium',
  'mono-bold': 'JetBrainsMono-Bold',
} as const;

export const fontWeight = {
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fontSize = {
  '2xs': 10,
  xs: 11,
  /** Mono section rails (e.g. ACTIVITY, BALANCES). */
  screenSection: 12,
  sm: 13,
  md: 14,
  base: 16,
  /** Thread composer primary line — restrained 15 dp body matching chat affordances. */
  threadComposer: 15,
  /** Ambient hub search body — optical between `base` and `lg`. */
  ambientSearch: 17,
  lg: 18,
  /** Ledger row amount numerals — ~21 dp headline beside title. */
  expenseLedgerAmount: 21,
  xl: 20,
  /** Premium ledger row title — Wallet × Nothing rhythm (~22 dp). */
  feedCardTitle: 22,
  '2xl': 24,
  /** Group hub hero — group name (between 3xl and 4xl). */
  hubTitle: 32,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  /** Monospace amount entry — add-expense hero (tabular, high presence). */
  amountHero: 80,
  '6xl': 64,
  /** Display numerals — expense amount hero, marketing stats. */
  '7xl': 80,
  '8xl': 96,
} as const;

export const lineHeight = {
  none: 1,
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 1.75,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  /** Ledger card title — optical tightening on soft slabs. */
  walletCardTitle: -0.5,
  /** Ledger amount numerals — paired with {@link fontSize}.`2xl`. */
  walletAmount: -0.6,
  /** Ledger subtitle under feed card title (~16 dp body). */
  walletSubtitle: -0.2,
  /** Inline metadata row — optical tightening (~14 dp). */
  ledgerCaption: -0.1,
  /** Hub “EXPENSES” rail label — wide-track uppercase. */
  expenseLedgerSection: 2,
  /** Floating tab labels — slight tightening without crowding. */
  navTab: -0.2,
  /** Ambient search field — ~−0.01 em at 17 dp. */
  ambientSearch: -0.17,
  normal: 0,
  wide: 0.2,
  wider: 0.5,
  widest: 1.2,
} as const;
