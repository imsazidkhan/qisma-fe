import type { ExpenseClassifyResponse } from '@/features/expenses/types/expenseTaxonomy.types';
import { radius, space, typography, useThemeColors } from '@/theme';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export type ExpenseClassifySuggestionBlockProps = {
  suggestion: ExpenseClassifyResponse;
  onApply: (data: ExpenseClassifyResponse) => void;
};

export function ExpenseClassifySuggestionBlock({
  suggestion,
  onApply,
}: ExpenseClassifySuggestionBlockProps): ReactElement | null {
  const { t } = useTranslation();
  const palette = useThemeColors();
  if (!suggestion.category) {
    return null;
  }

  const { category, subcategory } = suggestion;
  const categoryIcon = category.icon ?? null;
  const matchPct = Math.round((suggestion.confidence ?? 0.98) * 100);

  // Build breadcrumb trail
  const breadcrumbs: string[] = [];
  if (category.name) breadcrumbs.push(category.name);
  if (subcategory?.name) breadcrumbs.push(subcategory.name);

  return (
    <Animated.View entering={FadeIn.duration(240)}>
      <View
        style={{
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceElevated,
          padding: space.gapLg,
          gap: space.gapSm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapMd }}>
          {categoryIcon ? (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.surfaceRaised,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: palette.borderSubtle,
              }}
            >
              <Text style={{ fontSize: 30 }}>{categoryIcon}</Text>
            </View>
          ) : (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.surfaceRaised,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: palette.borderSubtle,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.mono.medium,
                  fontSize: typography.fontSize.lg,
                  color: palette.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                {(category.name ?? '?').slice(0, 2)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1, minWidth: 0, gap: space.gapXs }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: space.gapSm,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.mono.regular,
                  fontSize: typography.fontSize['2xs'],
                  letterSpacing: typography.letterSpacing.widest,
                  textTransform: 'uppercase',
                  color: palette.textMuted,
                }}
              >
                {t('expenses.add.classifySuggestedLabel')}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.regular,
                  fontSize: typography.fontSize.lg,
                  color: palette.textSecondary,
                }}
              >
                {matchPct}% match
              </Text>
            </View>
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.semiBold,
                fontSize: typography.fontSize['2xl'],
                color: palette.textPrimary,
              }}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            {breadcrumbs.length > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: space.gapXs,
                }}
              >
                {breadcrumbs.map((crumb, i) => (
                  <View
                    key={crumb}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapXs }}
                  >
                    {i > 0 ? (
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.sans.regular,
                          fontSize: typography.fontSize.lg,
                          color: palette.textMuted,
                        }}
                      >
                        ›
                      </Text>
                    ) : null}
                    <View
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: space.gapSm,
                        borderRadius: radius.full,
                        backgroundColor: palette.surfaceRaised,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.sans.regular,
                          fontSize: typography.fontSize.lg,
                          color: palette.textSecondary,
                        }}
                      >
                        {crumb}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.classifyApplyA11y')}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onApply(suggestion);
            }}
            style={({ pressed }) => ({
              marginLeft: 'auto',
              marginTop: space.gapSm,
              paddingVertical: space.gapSm,
              paddingHorizontal: space.gapLg,
              borderRadius: radius.full,
              backgroundColor: palette.surfaceRaised,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.semiBold,
                fontSize: typography.fontSize['2xl'],
                color: palette.accent,
              }}
            >
              {t('expenses.add.classifyUseThis')}
            </Text>
          </Pressable>
          </View>
      </View>
    </Animated.View>
  );
}
