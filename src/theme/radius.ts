import { radius as rawRadius } from './radius.tokens';

/**
 * Border-radius tokens. The flat scale + semantic aliases are also exposed
 * to Tailwind/NativeWind, so utilities like `rounded-md`, `rounded-card`,
 * `rounded-modal`, and `rounded-full` all resolve correctly.
 *
 * `sheet.{top,left,right}` is nested for inline-style use:
 *
 * @example
 *   // Bottom sheet — round only the top corners
 *   <View style={{
 *     borderTopLeftRadius: radius.sheet.top,
 *     borderTopRightRadius: radius.sheet.top,
 *   }} />
 *
 * In NativeWind, prefer the directional utilities for the same effect:
 * `rounded-t-2xl`, `rounded-l-2xl`, `rounded-r-2xl`.
 */
export const radius = {
  ...rawRadius,

  // Partial radius — for elements anchored to a screen edge.
  sheet: {
    top: 24, // bottom sheet — top corners only
    left: 24, // right-side drawer — left corners only
    right: 24, // left-side drawer — right corners only
  },
} as const;

export type RadiusToken = keyof typeof rawRadius;
export type Radius = typeof radius;
