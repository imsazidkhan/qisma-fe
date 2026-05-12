import * as Haptics from 'expo-haptics';
import type { ForwardedRef, ReactElement } from 'react';
import { forwardRef } from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type LuxurySplitPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  enableHaptics?: boolean;
};

function LuxurySplitPressableInner(
  {
    style,
    enableHaptics = true,
    onPress,
    onPressIn,
    onPressOut,
    ...rest
  }: LuxurySplitPressableProps,
  ref: ForwardedRef<React.ComponentRef<typeof Pressable>>,
): ReactElement {
  const pressedScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedScale.value }],
  }));

  const handleIn = (e: GestureResponderEvent): void => {
    if (enableHaptics) {
      void Haptics.selectionAsync().catch(() => {});
    }
    cancelAnimation(pressedScale);
    pressedScale.value = withTiming(0.985, {
      duration: duration.fast.ms,
      easing: easing.standard.rn,
    });
    onPressIn?.(e);
  };

  const handleOut = (e: GestureResponderEvent): void => {
    cancelAnimation(pressedScale);
    pressedScale.value = withTiming(1, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      {...rest}
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[animStyle, style]}
    />
  );
}

export const LuxurySplitPressable = forwardRef(LuxurySplitPressableInner);

LuxurySplitPressable.displayName = 'LuxurySplitPressable';
