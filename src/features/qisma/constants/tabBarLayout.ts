import { space, spacing } from '@/theme';

/**
 * Layout tokens for the floating Lastbench tab dock (+ safe-area padding math for
 * scrollable content above it).
 */
export const QISMA_TAB_BAR_LAYOUT = {
  /** Pill body height — intentionally low so content leads visually. */
  dockHeight: 64,
  /** Center add action — single primary affordance vs tall rail. */
  fabSize: 55,
  /** ≥ FAB width + optical gutters so Activity/Insights aren’t covered (flexBasis: 0 tabs). */
  fabSlotWidth: 78,
  /** Space above dock so FAB clears without clipping. */
  dockTopMargin: 12,
  /** Subtle float above dock pill centerline. */
  fabFloatAboveDock: 5,
  /** Breathing room below dock inside safe area (above home indicator). */
  marginBelowDock: 10,
  minSideTarget: 44,
  blurIntensity: 28,
  /** Horizontal inset inside dock chrome — balances rail breathing room vs label width. */
  dockPadH: spacing['2'] + spacing['1.5'],
  dockPadTop: 6,
  dockPadBottom: 8,
  /** Side-tab monochrome glyphs (outline). */
  tabGlyphSize: 18,
  tabGlyphStroke: 1.5,
} as const;

/**
 * Bottom padding for screens that sit behind the floating dock (tab scenes).
 */
export function getQismaTabBarContentInset(bottomSafeInset: number): number {
  return (
    bottomSafeInset +
    QISMA_TAB_BAR_LAYOUT.marginBelowDock +
    QISMA_TAB_BAR_LAYOUT.dockTopMargin +
    QISMA_TAB_BAR_LAYOUT.dockHeight
  );
}

/** Horizontal inset from screen edge when not using width-percent dock. */
export function getQismaTabBarHorizontalInset(): number {
  return space.screenPadding;
}
