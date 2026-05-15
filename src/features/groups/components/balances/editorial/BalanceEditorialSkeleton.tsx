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

import { duration, easing, radius, space, useThemeColors } from '@/theme';

export function BalanceEditorialSkeleton(): ReactElement {
  const palette = useThemeColors();
  const pulse = useSharedValue(0.28);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: duration.slower.ms, easing: easing.standard.rn }),
        withTiming(0.28, { duration: duration.slower.ms, easing: easing.standard.rn }),
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
    <View style={[styles.block, { marginTop: space.gapMd }]}>
      <Animated.View style={[styles.barSm, { backgroundColor: palette.borderStrong }, barStyle]} />
      <Animated.View style={[styles.barLg, { backgroundColor: palette.border }, barStyle]} />
      <Animated.View style={[styles.rule, { backgroundColor: palette.borderSubtle }, barStyle]} />
      <Animated.View style={[styles.barMd, { backgroundColor: palette.border }, barStyle]} />
      <Animated.View style={[styles.barMd, { backgroundColor: palette.border }, barStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: space.gapMd,
    alignSelf: 'stretch',
  },
  barSm: {
    height: 10,
    width: '38%',
    borderRadius: radius.xs,
  },
  barLg: {
    height: 28,
    width: '56%',
    borderRadius: radius.sm,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: space.gapXs,
  },
  barMd: {
    height: 14,
    alignSelf: 'stretch',
    borderRadius: radius.xs,
  },
});
