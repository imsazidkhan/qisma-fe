import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { radius, space, typography, useThemeColors } from '@/theme';
import { scale as scaleMotion, spring } from '@/theme/motion';

export const SPLIT_SHEET_ORDER: ExpenseSplitType[] = ['equal', 'exact', 'percentage', 'shares'];

export type SplitTabBarProps = {
  value: ExpenseSplitType;
  onChange: (next: ExpenseSplitType) => void;
  tabLabels: readonly string[];
};

export function splitTypeToSheetIndex(t: ExpenseSplitType): number {
  const i = SPLIT_SHEET_ORDER.indexOf(t);
  return i >= 0 ? i : 0;
}

export function sheetIndexToSplitType(i: number): ExpenseSplitType {
  return SPLIT_SHEET_ORDER[i] ?? 'equal';
}

function Segment({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (reduceMotion) return;
        pressScale.value = withSpring(scaleMotion.pressedLight.value, spring.stiff);
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, spring.snappy);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{ flex: 1, minWidth: 0 }}
    >
      <Animated.View
        style={[
          pressStyle,
          {
            paddingVertical: space.gapSm,
            paddingHorizontal: space.gapXs,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: selected ? palette.textPrimary : palette.border,
            backgroundColor: selected ? palette.textPrimary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize['2xs'],
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            color: selected ? palette.background : palette.textMuted,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function SplitTabBar({ value, onChange, tabLabels }: SplitTabBarProps): ReactElement {
  const selectedIndex = splitTypeToSheetIndex(value);

  const onSelect = useCallback(
    (index: number) => {
      void Haptics.selectionAsync().catch(() => {});
      onChange(sheetIndexToSplitType(index));
    },
    [onChange],
  );

  return (
    <View style={{ flexDirection: 'row', gap: space.gapXs, alignItems: 'stretch' }}>
      {tabLabels.map((label, index) => (
        <Segment
          key={label}
          label={label}
          selected={index === selectedIndex}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}
