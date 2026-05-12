/**
 * Spacing & z-index primitives.
 *
 * All spacing values are absolute pixels on a 4-unit grid. Tailwind utilities
 * (`p-4`, `gap-3`, `pt-12`, `m-px`) resolve directly to these — we deliberately
 * REPLACE Tailwind's rem-based defaults so the design system controls every
 * layout dimension.
 */
const BASE = 4;
const u = (n: number) => BASE * n;

export const spacing = {
  px: 1, // hairline — borders, dividers only
  '0.5': u(0.5), // 2  — icon internal nudges
  1: u(1), // 4  — chip internal padding, icon gap
  '1.5': u(1.5), // 6  — tight inline gap
  2: u(2), // 8  — default inline gap, icon-to-label
  '2.5': u(2.5), // 10
  3: u(3), // 12 — small component padding
  4: u(4), // 16 — default component padding
  5: u(5), // 20 — card padding compact
  6: u(6), // 24 — card padding default
  7: u(7), // 28
  8: u(8), // 32 — section gap
  9: u(9), // 36
  10: u(10), // 40 — large section gap
  11: 44, // touch-target minimum (Apple HIG / Material). Off-grid by design.
  12: u(12), // 48
  14: u(14), // 56 — tab bar height region
  16: u(16), // 64
  20: u(20), // 80
  24: u(24), // 96
  32: u(32), // 128
  40: u(40), // 160
  48: u(48), // 192
  64: u(64), // 256
} as const;

export const zIndex = {
  base: 0,
  raised: 1,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
  tooltip: 60,
} as const;
