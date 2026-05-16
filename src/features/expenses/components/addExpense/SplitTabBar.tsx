import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { radius, spacing, typography, useThemeColors } from '@/theme';
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
      style={{ flex: 1, minWidth: 0, zIndex: 1 }}
    >
      <Animated.View
        style={[
          pressStyle,
          {
            minHeight: spacing[12],
            paddingVertical: spacing['1'],
            paddingHorizontal: spacing['2'],
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize.xs,
            letterSpacing: typography.letterSpacing.wide,
            color: selected ? palette.background : palette.textSecondary,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function SplitTabBar({ value, onChange, tabLabels }: SplitTabBarProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();
  const selectedIndex = splitTypeToSheetIndex(value);
  const [rowWidth, setRowWidth] = useState(0);
  const layoutReady = useRef(false);

  const segmentWidth = rowWidth > 0 ? rowWidth / tabLabels.length : 0;

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const targetX = selectedIndex * segmentWidth;
    pillW.value = segmentWidth;

    if (!layoutReady.current) {
      pillX.value = targetX;
      layoutReady.current = true;
      return;
    }

    if (reduceMotion) {
      pillX.value = targetX;
      return;
    }

    pillX.value = withSpring(targetX, spring.gentle);
  }, [pillW, pillX, reduceMotion, segmentWidth, selectedIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
  }));

  const onSelect = useCallback(
    (index: number) => {
      void Haptics.selectionAsync().catch(() => undefined);
      onChange(sheetIndexToSplitType(index));
    },
    [onChange],
  );

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('expenses.add.modern.splitTabListA11y')}
      style={{
        borderRadius: radius.md,
        backgroundColor: palette.surfaceFloating,
        paddingVertical: spacing['1'],
        paddingHorizontal: spacing['1.5'],
      }}
    >
      <View
        style={{ position: 'relative', flexDirection: 'row', alignItems: 'stretch' }}
        onLayout={onRowLayout}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: radius.sm,
              backgroundColor: palette.textPrimary,
              zIndex: 0,
            },
            pillStyle,
          ]}
        />
        {tabLabels.map((label, index) => (
          <Segment
            key={label}
            label={label}
            selected={index === selectedIndex}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
    </View>
  );
}
