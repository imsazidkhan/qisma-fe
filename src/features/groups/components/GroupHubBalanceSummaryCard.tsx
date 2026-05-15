import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import { BalanceHeroFootline } from '@/features/groups/components/BalanceHeroFootline';
import type { GroupBalancesViewerSummaryStatus } from '@/features/groups/types/groupBalancesViewer.types';
import { platformShadow, radius, space, textStyles, typography, useThemeColors } from '@/theme';

type HubBalancePalette = ReturnType<typeof useThemeColors>;

export type GroupHubBalanceSummaryVariant = 'preview' | 'settled' | 'active';

export type GroupHubBalanceSummaryTone = 'owed_to_you' | 'you_owe';

export type GroupHubActiveBalanceFootline = {
  count: number;
  status: GroupBalancesViewerSummaryStatus;
};

export type GroupHubBalanceSummaryCardProps = {
  variant: GroupHubBalanceSummaryVariant;
  /** Meaningful when `variant === 'active'`. */
  tone?: GroupHubBalanceSummaryTone;
  eyebrow: string;
  primaryText: string;
  /** Group-level open-edge count — omit for preview or before snapshot loads. */
  activeBalanceFootline?: GroupHubActiveBalanceFootline;
  settleCtaLabel: string;
  settleCtaA11y: string;
  showSettleCta?: boolean;
  onSettlePress?: () => void;
  settleDisabled?: boolean;
};

function statusGlyphColor(
  palette: HubBalancePalette,
  variant: GroupHubBalanceSummaryVariant,
  tone: GroupHubBalanceSummaryTone | undefined,
): string {
  if (variant === 'preview') {
    return palette.textMuted;
  }
  if (variant === 'settled') {
    return palette.textMuted;
  }
  if (tone === 'owed_to_you') {
    return palette.successText;
  }
  if (tone === 'you_owe') {
    return palette.errorText;
  }
  return palette.textMuted;
}

function primaryTextColor(
  palette: HubBalancePalette,
  variant: GroupHubBalanceSummaryVariant,
  tone: GroupHubBalanceSummaryTone | undefined,
): string {
  if (variant === 'preview') {
    return palette.textSecondary;
  }
  if (variant === 'settled') {
    return palette.textPrimary;
  }
  if (tone === 'owed_to_you') {
    return palette.successText;
  }
  return palette.textPrimary;
}

export function GroupHubBalanceSummaryCard({
  variant,
  tone,
  eyebrow,
  primaryText,
  activeBalanceFootline,
  settleCtaLabel,
  settleCtaA11y,
  showSettleCta = false,
  onSettlePress,
  settleDisabled = false,
}: GroupHubBalanceSummaryCardProps): ReactElement {
  const palette = useThemeColors();

  const glyph = statusGlyphColor(palette, variant, tone);
  const primaryColor = primaryTextColor(palette, variant, tone);

  const borderColor = palette.borderSubtle;

  const showDividerBeforeCta = Boolean(showSettleCta && onSettlePress);

  return (
    <View
      style={[
        styles.cardShell,
        platformShadow('xs'),
        {
          borderColor,
          backgroundColor: palette.premiumCardSurface,
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.glass }]} />
      <BalanceDotMatrixTexture dotColor={palette.textPrimary} dotOpacity={0.048} />

      <View style={styles.inner}>
        <View style={styles.labelRow}>
          <View
            style={[styles.glyph, { backgroundColor: glyph }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
            {eyebrow.toUpperCase()}
          </Text>
        </View>

        <Text
          style={[
            variant === 'preview' ? styles.primaryPreview : styles.primaryHero,
            { color: primaryColor },
          ]}
          accessibilityRole={variant === 'preview' ? undefined : 'header'}
        >
          {primaryText}
        </Text>

        {activeBalanceFootline ? (
          <BalanceHeroFootline
            count={activeBalanceFootline.count}
            status={activeBalanceFootline.status}
          />
        ) : null}

        {showDividerBeforeCta ? (
          <View style={[styles.ruleFull, { backgroundColor: palette.borderSubtle }]} />
        ) : null}

        {showSettleCta && onSettlePress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={settleCtaA11y}
            disabled={settleDisabled}
            onPress={onSettlePress}
            style={({ pressed }) => [
              styles.ctaPill,
              {
                borderColor: palette.border,
                backgroundColor: pressed ? palette.overlayStrong : palette.overlay,
                opacity: settleDisabled ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: palette.textPrimary }]}>
              {settleCtaLabel.toUpperCase()}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    alignSelf: 'stretch',
    borderRadius: radius.inviteCard,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    padding: space.paddingLg,
    gap: space.gapSm,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  glyph: {
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
  primaryHero: {
    ...textStyles.numericLarge,
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
    fontVariant: ['tabular-nums'],
    alignSelf: 'stretch',
  },
  primaryPreview: {
    ...textStyles.bodyLarge,
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    alignSelf: 'stretch',
  },
  ruleFull: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    opacity: 0.55,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    paddingVertical: space.gapSm,
    paddingHorizontal: space.paddingLg,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaLabel: {
    ...textStyles.label,
    fontFamily: typography.fontFamily.mono.bold,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.widest,
  },
});
