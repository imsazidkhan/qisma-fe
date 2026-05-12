import type { ColorValue } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

type GlyphProps = {
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
};

export function QismaHomeGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function QismaPeopleGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Single-user glyph — profile tab (distinct from the two-person “people” mark). */
export function QismaUserGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Groups tab — overlapping frames (list / cohorts). */
export function QismaGroupsGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4.5h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.5 15h15a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5A1.5 1.5 0 0 1 4.5 15Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Invites / inbox — open envelope. */
export function QismaInvitesGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m2.5 8 8.35 5.57a1.5 1.5 0 0 0 1.65 0L21.5 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Activity tab — pulse / timeline tick. */
export function QismaActivityGlyphIcon({ color, size = 24, strokeWidth = 1.5 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19V5M4 14l4-4 4 3 4-8 4 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function QismaPlusGlyphIcon({ color, size = 28, strokeWidth = 1.75 }: GlyphProps) {
  const c = 12;
  const half = 7;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1={c - half}
        y1={c}
        x2={c + half}
        y2={c}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={c}
        y1={c - half}
        x2={c}
        y2={c + half}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
