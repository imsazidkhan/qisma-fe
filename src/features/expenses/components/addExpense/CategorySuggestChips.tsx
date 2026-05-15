import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { radius, space, typography, useThemeColors } from '@/theme';

export type ExpenseCategorySlug = 'food' | 'transport' | 'shopping' | 'home' | 'bills' | 'other';

type SlugMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

const SLUG_META: Record<ExpenseCategorySlug, SlugMeta> = {
  food: { icon: 'restaurant-outline', labelKey: 'expenses.add.premium.categoryTagFood' },
  transport: { icon: 'car-outline', labelKey: 'expenses.add.premium.categoryTagTransport' },
  shopping: { icon: 'bag-handle-outline', labelKey: 'expenses.add.quickPickShopping' },
  home: { icon: 'home-outline', labelKey: 'expenses.add.premium.categoryTagHome' },
  bills: { icon: 'receipt-outline', labelKey: 'expenses.add.quickPickBills' },
  other: { icon: 'ellipsis-horizontal', labelKey: 'expenses.add.quickPickMore' },
};

const QUICK_PICK_ORDER: ExpenseCategorySlug[] = [
  'food',
  'transport',
  'shopping',
  'home',
  'bills',
  'other',
];

export type CategorySuggestChipsProps = {
  title: string;
  selected: string | undefined;
  onSelect: (next: ExpenseCategorySlug | undefined) => void;
};

/** Quick category picks — circular monochrome icons with labels. */
export function CategorySuggestChips({
  title: _title,
  selected,
  onSelect,
}: CategorySuggestChipsProps): ReactElement | null {
  const { t } = useTranslation();
  const palette = useThemeColors();

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={{ alignSelf: 'stretch', gap: space.gapMd }}
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
        {t('expenses.add.quickPicksTitle')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: space.gapSm,
        }}
      >
        {QUICK_PICK_ORDER.map((slug) => {
          const active = selected === slug;
          const meta = SLUG_META[slug];
          return (
            <Pressable
              key={slug}
              accessibilityRole="button"
              accessibilityLabel={t(meta.labelKey)}
              accessibilityState={{ selected: active }}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                onSelect(active ? undefined : slug);
              }}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: space.gapXs,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? palette.textPrimary : palette.surfaceRaised,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: active ? palette.textPrimary : palette.borderStrong,
                }}
              >
                <Ionicons
                  name={meta.icon}
                  size={19}
                  color={active ? palette.background : palette.textSecondary}
                />
              </View>
              <Text
                style={{
                  fontFamily: typography.fontFamily.mono.regular,
                  fontSize: typography.fontSize['2xs'],
                  letterSpacing: typography.letterSpacing.wide,
                  color: active ? palette.textPrimary : palette.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                {t(meta.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
