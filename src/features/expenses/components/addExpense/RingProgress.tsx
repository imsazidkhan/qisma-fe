import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { duration, easing, useThemeColors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type RingProgressProps = {
  /** 0..1, clamped. Drives both the arc length and the colour ramp. */
  progress: number;
  /** Outer diameter in points. Defaults to 56 (matches the mockup). */
  size?: number;
  /** Stroke width. Defaults to 4. */
  strokeWidth?: number;
  /** When true, paints the ring in the warning hue. */
  hasError?: boolean;
};

/**
 * Minimal SVG donut. Track is a faint hairline ring (`borderSubtle`); the
 * progress arc paints in `textPrimary` (ink in light, near-white in dark) so
 * it reads on both palettes without leaning on the brand accent. The arc
 * starts at 12 o'clock and grows clockwise.
 */
export function RingProgress({
  progress,
  size = 56,
  strokeWidth = 4,
  hasError = false,
}: RingProgressProps): ReactElement {
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const v = useSharedValue(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    v.value = reduceMotion
      ? target
      : withTiming(target, { duration: duration.normal.ms, easing: easing.standard.rn });
  }, [progress, reduceMotion, v]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - v.value),
  }));

  const arcColor = hasError ? palette.warningBorder : palette.textPrimary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.borderSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>
    </View>
  );
}
