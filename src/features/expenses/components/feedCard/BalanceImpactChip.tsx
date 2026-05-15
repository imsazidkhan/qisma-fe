import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ExpenseFeedSettlementGlance } from '@/features/expenses/utils/expenseFeedRowFormat';
import type { ExpenseFeedViewerImpactChipTone } from '@/features/expenses/utils/expenseFeedViewerImpact';
import { radius, space, typography } from '@/theme';
import type { useThemeColors } from '@/theme';

export type BalanceImpactChipProps = {
  label: string;
  tone: ExpenseFeedViewerImpactChipTone;
  settlement?: ExpenseFeedSettlementGlance | null;
  palette: ReturnType<typeof useThemeColors>;
};

export function BalanceImpactChip({
  label,
  tone,
  settlement,
  palette,
}: BalanceImpactChipProps): ReactElement {
  const accent =
    tone === 'lent' ? palette.successText : tone === 'owe' ? palette.errorText : palette.textMuted;

  const settlementBorder =
    settlement === 'pending'
      ? palette.warningText
      : settlement === 'partial'
        ? palette.infoText
        : settlement === 'settled'
          ? palette.successText
          : palette.borderSubtle;

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.shell,
        {
          borderColor: settlementBorder,
          backgroundColor: palette.expenseFeedMetaChipSurface,
        },
      ]}
    >
      <View style={[styles.strip, { backgroundColor: accent }]} accessibilityElementsHidden />
      <Text
        style={[
          styles.label,
          {
            color: tone === 'muted' ? palette.textSecondary : palette.textPrimary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '78%',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  strip: {
    width: 2,
    alignSelf: 'stretch',
    opacity: 0.88,
  },
  label: {
    flexShrink: 1,
    paddingVertical: space.gapXs,
    paddingLeft: space.gapSm,
    paddingRight: space.gapSm,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
});
