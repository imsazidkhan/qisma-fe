import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RingProgress } from '@/features/expenses/components/addExpense/RingProgress';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { radius, size as sz, space, typography, useThemeColors } from '@/theme';

export type SplitPreviewCardProps = {
  splitTypeLabel: string;
  splitType: ExpenseSplitType;
  onChangeSplit: () => void;
  /** Already-localised "3 people" caption. */
  peopleCountLabel: string;
  /** Per-person amount in major units (sanitized, no commas) or null when unset. */
  perPersonMajor: string | null;
  currency: string;
  /** 0..1 ratio of total currently allocated. */
  progress: number;
  hasError?: boolean;
};

/**
 * Split section body — meant to be placed inside a `SectionCard` ("SPLIT"
 * kicker, chevron, etc. live on the card). Two clean halves separated by a
 * vertical hairline:
 *   ┌───────────────────────────┬───────────────────────────┐
 *   │ 👥  ₹1,500                │   ⌬   100%                │
 *   │     Per person            │       Total split         │
 *   └───────────────────────────┴───────────────────────────┘
 */
export function SplitPreviewCard({
  splitTypeLabel,
  onChangeSplit,
  peopleCountLabel,
  perPersonMajor,
  currency,
  progress,
  hasError = false,
}: SplitPreviewCardProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();

  const pctLabel = `${Math.round(progress * 100)}%`;
  const perPersonLabel =
    perPersonMajor !== null
      ? formatExpenseMajorAmount(perPersonMajor.replace(/,/g, ''), currency)
      : t('expenses.add.modern.previewAmountPlaceholder');

  return (
    <View style={{ gap: space.gapMd, alignSelf: 'stretch', width: '100%' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${splitTypeLabel}. ${t('expenses.add.modern.splitEditHint')}`}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onChangeSplit();
        }}
        style={({ pressed }) => ({
          position: 'relative',
          alignSelf: 'stretch',
          width: '100%',
          minHeight: sz.touchMin,
          paddingRight: space.gapSm + sz.iconMd,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{
            alignSelf: 'stretch',
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: typography.fontSize.lg,
            color: palette.textPrimary,
          }}
          numberOfLines={1}
        >
          {splitTypeLabel}
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: sz.iconMd,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={palette.iconMuted} />
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: space.gapXs,
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
          {t('expenses.add.modern.previewKicker')}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.mono.regular,
            fontSize: typography.fontSize['2xs'],
            letterSpacing: typography.letterSpacing.widest,
            color: palette.textMuted,
          }}
        >
          {peopleCountLabel}
        </Text>
      </View>

      <View
        collapsable={false}
        style={{
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'stretch',
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: hasError ? palette.warningBorder : palette.borderSubtle,
          backgroundColor: palette.surfaceFloating,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: space.gapMd,
            paddingHorizontal: space.paddingMd,
            gap: space.gapMd,
          }}
        >
          <View
            style={{
              width: sz.iconLg,
              height: sz.iconLg,
              borderRadius: radius.full,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderStrong,
              backgroundColor: palette.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="people-outline" size={16} color={palette.black} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: typography.fontFamily.sans.bold,
                fontSize: typography.fontSize.lg,
                color: palette.textPrimary,
                fontVariant: ['tabular-nums'],
                letterSpacing: typography.letterSpacing.tight,
              }}
            >
              {perPersonLabel}
            </Text>
            <Text
              style={{
                marginTop: space.gapXs,
                fontFamily: typography.fontFamily.sans.regular,
                fontSize: typography.fontSize.xs,
                color: palette.textMuted,
              }}
            >
              {t('expenses.add.modern.previewPerPerson')}
            </Text>
          </View>
        </View>

        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: palette.borderSubtle }} />

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: space.gapMd,
            paddingHorizontal: space.paddingMd,
            gap: space.gapMd,
          }}
        >
          <RingProgress progress={progress} size={36} strokeWidth={3} hasError={hasError} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.bold,
                fontSize: typography.fontSize.lg,
                color: hasError ? palette.warningText : palette.textPrimary,
                fontVariant: ['tabular-nums'],
                letterSpacing: typography.letterSpacing.tight,
              }}
              numberOfLines={1}
            >
              {pctLabel}
            </Text>
            <Text
              style={{
                marginTop: space.gapXs,
                fontFamily: typography.fontFamily.sans.regular,
                fontSize: typography.fontSize.xs,
                color: palette.textMuted,
              }}
            >
              {t('expenses.add.modern.previewTotalSplit')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
