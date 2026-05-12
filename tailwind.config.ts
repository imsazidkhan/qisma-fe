/**
 * Tailwind / NativeWind config.
 *
 * Loaded by tailwindcss 3.4 via `jiti` so we can import design tokens directly
 * from the TypeScript source — no `.tokens.js` shadow files, no drift risk.
 *
 * Strategy:
 *   - REPLACE `theme.spacing` and `theme.borderRadius` so utilities resolve to
 *     exact design-system pixels (e.g. `p-4 = 16px`, not `1rem`).
 *   - EXTEND `colors`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`,
 *     `letterSpacing`, `borderWidth`, `zIndex` so Tailwind's defaults stay
 *     available where they don't conflict.
 */
import type { Config } from 'tailwindcss';

import { borderWidth } from './src/theme/borders.tokens';
import { colors } from './src/theme/colors.tokens';
import { radius } from './src/theme/radius.tokens';
import { spacing, zIndex } from './src/theme/spacing.tokens';
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from './src/theme/typography.tokens';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nativewindPreset = require('nativewind/preset');

const px = (n: number) => `${n}px`;

const tailwindFontSize = Object.fromEntries(Object.entries(fontSize).map(([k, v]) => [k, px(v)]));
const tailwindLetterSpacing = Object.fromEntries(
  Object.entries(letterSpacing).map(([k, v]) => [k, px(v)]),
);
const tailwindLineHeight = Object.fromEntries(
  Object.entries(lineHeight).map(([k, v]) => [k, String(v)]),
);
const tailwindSpacing = Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, px(v)]));
const tailwindRadius = Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, px(v)]));
const tailwindZIndex = Object.fromEntries(Object.entries(zIndex).map(([k, v]) => [k, String(v)]));
const tailwindBorderWidth = Object.fromEntries(
  Object.entries(borderWidth).map(([k, v]) => [k, px(v)]),
);

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [nativewindPreset],
  theme: {
    spacing: tailwindSpacing,
    borderRadius: tailwindRadius,
    extend: {
      colors,
      fontFamily,
      fontSize: tailwindFontSize,
      fontWeight,
      lineHeight: tailwindLineHeight,
      letterSpacing: tailwindLetterSpacing,
      zIndex: tailwindZIndex,
      borderWidth: tailwindBorderWidth,
    },
  },
  plugins: [],
};

export default config;
