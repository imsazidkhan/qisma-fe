import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, useThemeColors } from '@/theme';

/**
 * Tiny circular indicator. The whole point is to communicate one bit of
 * state at a glance — what's the system doing right now? It earns its
 * pixels by being the same shape across every screen state, just in a
 * different colour / animation:
 *
 *   - `idle`     muted, static  → "ok, nothing to see here"
 *   - `online`   accent, static → "ready to go"
 *   - `sending`  primary, calm pulse → "in flight"
 *   - `offline`  muted, static  → "no network"
 *   - `error`    primary, static → "you should look at me"
 *
 * Decorative — `accessibilityElementsHidden` so screen readers don't get
 * an unhelpful "View" interruption. The surrounding text already carries
 * the message.
 */

export type StatusDotState = 'idle' | 'online' | 'sending' | 'offline' | 'error';

export type StatusDotProps = {
  state: StatusDotState;
  /** Diameter in px. Default 6. */
  size?: number;
};

export function StatusDot({ state, size = 6 }: StatusDotProps) {
  const palette = useThemeColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(opacity);
    if (state === 'sending') {
      // Calm pulse: 1 → 0.35 → 1 over 1.4s. Loops indefinitely.
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.35, {
            duration: 700,
            easing: easing.standard.rn,
          }),
          withTiming(1, {
            duration: 700,
            easing: easing.standard.rn,
          }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(1, {
        duration: duration.fast.ms,
        easing: easing.standard.rn,
      });
    }
  }, [state, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const color = (() => {
    switch (state) {
      case 'online':
      case 'sending':
        return palette.accent;
      case 'error':
        return palette.textPrimary;
      case 'offline':
      case 'idle':
      default:
        return palette.textMuted;
    }
  })();

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
});
