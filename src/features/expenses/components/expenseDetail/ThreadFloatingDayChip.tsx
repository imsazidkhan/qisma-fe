import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { layoutGrid, radius, typography, useThemeColors } from '@/theme';

export type ThreadFloatingDayChipProps = {
  label: string;
  /** 0 = hidden / exiting, 1 = visible (drive with `withTiming`). */
  visibility: SharedValue<number>;
};

export function ThreadFloatingDayChip({
  label,
  visibility,
}: ThreadFloatingDayChipProps): ReactElement {
  const palette = useThemeColors();

  const pillStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [
      {
        translateX: interpolate(visibility.value, [0, 1], [-40, 0]),
      },
    ],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      pointerEvents="none"
      style={[styles.anchor, pillStyle]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: palette.textSecondary,
            borderColor: palette.borderSubtle,
            backgroundColor: palette.surfaceElevated,
          },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    top: layoutGrid.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  label: {
    maxWidth: '88%',
    paddingVertical: layoutGrid.micro,
    paddingHorizontal: layoutGrid.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
});
