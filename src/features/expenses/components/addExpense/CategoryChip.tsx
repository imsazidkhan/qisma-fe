import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExpenseCategoryListItem } from '@/features/expenses/types/expenseTaxonomy.types';
import { renderExpenseTierIcon } from '@/features/expenses/utils/renderExpenseTierIcon';
import { radius, space, typography, useThemeColors } from '@/theme';

export type CategoryChipProps = {
  category: ExpenseCategoryListItem;
  onDismiss: () => void;
};

/** Dismissible auto-filled category chip for high-confidence classify results. */
export function CategoryChip({ category, onDismiss }: CategoryChipProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.gapSm,
        paddingVertical: space.gapSm,
        paddingHorizontal: space.gapMd,
        borderRadius: radius.full,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.borderStrong,
        backgroundColor: palette.surfaceRaised,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surfaceFloating,
        }}
      >
        {renderExpenseTierIcon(category, {
          size: 22,
          glyphColor: palette.textSecondary,
          fallbackTextColor: palette.textMuted,
          fallbackIon: 'pricetag-outline',
        })}
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.letterSpacing.wide,
          textTransform: 'uppercase',
          color: palette.textPrimary,
        }}
        numberOfLines={1}
      >
        {category.name}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss category suggestion"
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onDismiss();
        }}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="close" size={14} color={palette.iconMuted} />
      </Pressable>
    </View>
  );
}
