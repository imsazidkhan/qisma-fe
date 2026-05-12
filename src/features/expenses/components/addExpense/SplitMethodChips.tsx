import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { radius, space, typography, useThemeColors } from '@/theme';

const SPLIT_TYPES = [
  'equal',
  'exact',
  'percentage',
  'shares',
] as const satisfies readonly ExpenseSplitType[];

export type SplitMethodChipsProps = {
  splitType: ExpenseSplitType;
  onSelect: (next: ExpenseSplitType) => void;
};

/** Inline segmented control — monochrome inversion on selection, no scroll. */
export function SplitMethodChips({ splitType, onSelect }: SplitMethodChipsProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const label = (type: ExpenseSplitType): string => {
    switch (type) {
      case 'equal':
        return t('expenses.add.modern.splitChipEqual');
      case 'exact':
        return t('expenses.add.modern.splitChipExact');
      case 'percentage':
        return t('expenses.add.modern.tabPercent');
      case 'shares':
        return t('expenses.add.modern.splitChipShares');
      default:
        return t('expenses.add.modern.splitChipEqual');
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.borderStrong,
        borderRadius: radius.sm,
        overflow: 'hidden',
        alignSelf: 'stretch',
      }}
    >
      {SPLIT_TYPES.map((type, i) => {
        const selected = splitType === type;
        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={label(type)}
            accessibilityState={{ selected }}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onSelect(type);
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: space.gap,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? palette.textPrimary : 'transparent',
              borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderLeftColor: palette.borderStrong,
              opacity: pressed && !selected ? 0.72 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                letterSpacing: typography.letterSpacing.wider,
                textTransform: 'uppercase',
                color: selected ? palette.background : palette.textMuted,
              }}
            >
              {label(type)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
