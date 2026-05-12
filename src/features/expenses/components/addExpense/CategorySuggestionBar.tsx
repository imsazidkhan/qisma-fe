import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ExpenseCategoryListItem } from '@/features/expenses/types/expenseTaxonomy.types';
import { radius, space, typography, useThemeColors } from '@/theme';

export type CategorySuggestionBarProps = {
  suggestions: ExpenseCategoryListItem[];
  onPick: (category: ExpenseCategoryListItem) => void;
  onPickOther: () => void;
};

/** Medium-confidence alternatives with "Other" affordance. */
export function CategorySuggestionBar({
  suggestions,
  onPick,
  onPickOther,
}: CategorySuggestionBarProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View style={{ gap: space.gapSm }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.regular,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: palette.textMuted,
        }}
      >
        Suggested categories
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: space.gapXs }}
      >
        {suggestions.slice(0, 3).map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Select ${c.name}`}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onPick(c);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.gapXs,
              paddingVertical: space.paddingXs,
              paddingHorizontal: space.gapSm,
              borderRadius: radius.full,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderStrong,
              backgroundColor: palette.surfaceRaised,
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Text style={{ fontSize: 12 }}>{c.icon ?? '•'}</Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                letterSpacing: typography.letterSpacing.wide,
                color: palette.textSecondary,
              }}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open full category picker"
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            onPickOther();
          }}
          style={({ pressed }) => ({
            paddingVertical: space.paddingXs,
            paddingHorizontal: space.gapSm,
            borderRadius: radius.full,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.borderStrong,
            backgroundColor: 'transparent',
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              letterSpacing: typography.letterSpacing.wider,
              color: palette.textSecondary,
            }}
          >
            Other →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
