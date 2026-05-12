/**
 * Border-thickness primitives. Exposed to Tailwind as `border-{key}` /
 * `border-t-{key}` / `border-l-{key}` etc.
 */
export const borderWidth = {
  none: 0,
  hairline: 0.5, // dividers, subtle outlines (default)
  thin: 1, // standard borders
  medium: 1.5, // emphasized / focused state
  thick: 2, // featured / selected state
  heavy: 3, // progress bars, step indicators
  bold: 4, // accent bars, left-edge highlights
} as const;
