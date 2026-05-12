import { space } from '@/theme';

/**
 * Layout tokens for the floating Qisma tab dock (+ safe-area padding math for
 * scrollable content above it).
 */
export const QISMA_TAB_BAR_LAYOUT = {
  dockHeight: 44,
  fabSize: 56,
  /** Space reserved above the dock so the FAB can “peek” over the pill without clipping. */
  dockTopMargin: 12,
  /** Extra breathing room under the dock inside the safe area. */
  marginBelowDock: 8,
  minSideTarget: 44,
  blurIntensity: 32,
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

/** Horizontal inset from screen edge to the pill — reuses screen padding token. */
export function getQismaTabBarHorizontalInset(): number {
  return space.screenPaddingSm;
}
