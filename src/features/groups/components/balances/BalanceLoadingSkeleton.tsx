import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FrostedBalanceSurface } from '@/features/groups/components/balances/FrostedBalanceSurface';
import { duration, easing, radius, space, useThemeColors } from '@/theme';

export function BalanceLoadingSkeleton(): ReactElement {
  const palette = useThemeColors();
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: duration.slower.ms, easing: easing.standard.rn }),
        withTiming(0.35, { duration: duration.slower.ms, easing: easing.standard.rn }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <FrostedBalanceSurface dotTexture style={{ marginTop: space.gapMd }}>
      <View style={styles.pad}>
        <Animated.View
          style={[styles.barSm, { backgroundColor: palette.surfaceOverlay }, barStyle]}
        />
        <Animated.View
          style={[styles.barLg, { backgroundColor: palette.surfaceOverlay }, barStyle]}
        />
        <Animated.View
          style={[styles.barMd, { backgroundColor: palette.surfaceRaised }, barStyle]}
        />
      </View>
    </FrostedBalanceSurface>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: space.gapLg,
    gap: space.gapMd,
    alignSelf: 'stretch',
  },
  barSm: {
    height: 12,
    width: '42%',
    borderRadius: radius.sm,
  },
  barLg: {
    height: 36,
    width: '72%',
    borderRadius: radius.md,
  },
  barMd: {
    height: 52,
    alignSelf: 'stretch',
    borderRadius: radius.md,
  },
});
