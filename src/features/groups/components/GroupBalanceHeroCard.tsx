import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import { BalanceHeroFootline } from '@/features/groups/components/BalanceHeroFootline';
import type { GroupBalancesViewerSummaryStatus } from '@/features/groups/types/groupBalancesViewer.types';
import { platformShadow, radius, space, textStyles, typography, useThemeColors } from '@/theme';

type BalancePalette = ReturnType<typeof useThemeColors>;

export type GroupBalanceHeroCardProps = {
  eyebrow: string;
  status: GroupBalancesViewerSummaryStatus;
  /** Compact formatted net magnitude (e.g. ₹10,550). */
  amountDisplay: string;
  /** Count of open settlement edges — summary layer only. */
  activeBalanceCount: number;
  accessibilityLabel: string;
};

function glyphColor(palette: BalancePalette, status: GroupBalancesViewerSummaryStatus): string {
  if (status === 'settled') {
    return palette.textMuted;
  }
  if (status === 'owed_to_you') {
    return palette.successText;
  }
  return palette.errorText;
}

function amountColor(palette: BalancePalette, status: GroupBalancesViewerSummaryStatus): string {
  if (status === 'settled') {
    return palette.textPrimary;
  }
  if (status === 'owed_to_you') {
    return palette.successText;
  }
  return palette.textPrimary;
}

export function GroupBalanceHeroCard({
  eyebrow,
  status,
  amountDisplay,
  activeBalanceCount,
  accessibilityLabel,
}: GroupBalanceHeroCardProps): ReactElement {
  const palette = useThemeColors();
  const glyph = glyphColor(palette, status);
  const primary = amountColor(palette, status);

  return (
    <View
      style={[
        styles.shell,
        platformShadow('premiumCard'),
        {
          borderColor: palette.overlayHeavy,
          backgroundColor: palette.premiumCardSurface,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.glass }]} />
      <BalanceDotMatrixTexture dotColor={palette.textPrimary} />

      <View style={styles.inner}>
        <View style={styles.labelRow}>
          <View
            style={[styles.dot, { backgroundColor: glyph }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text
            style={[styles.eyebrow, { color: palette.textMuted }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {eyebrow.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.ruleShort, { backgroundColor: palette.borderSubtle }]} />

        <Text style={[styles.amount, { color: primary }]}>{amountDisplay}</Text>

        <BalanceHeroFootline count={activeBalanceCount} status={status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    borderRadius: radius.inviteCard,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    paddingTop: space.gapMd,
    paddingBottom: space.gap,
    paddingLeft: space.paddingLg,
    paddingRight: space.paddingMd,
    gap: 0,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  eyebrow: {
    ...textStyles.overline,
    flex: 1,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  ruleShort: {
    marginTop: space.gapXs,
    width: 40,
    height: StyleSheet.hairlineWidth,
    opacity: 0.85,
  },
  amount: {
    ...textStyles.numericLarge,
    fontSize: typography.fontSize['5xl'],
    lineHeight: typography.fontSize['5xl'] * typography.lineHeight.tight,
    fontVariant: ['tabular-nums'],
    marginTop: space.gapXs,
    alignSelf: 'stretch',
  },
});
