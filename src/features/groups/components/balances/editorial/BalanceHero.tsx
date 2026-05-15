import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AmountDisplay,
  type BalanceAmountSemantic,
} from '@/features/groups/components/balances/editorial/AmountDisplay';
import type { GroupBalancesViewerSummaryStatus } from '@/features/groups/types/groupBalancesViewer.types';
import { space, textStyles, typography, useThemeColors } from '@/theme';

export type BalanceHeroProps = {
  status: GroupBalancesViewerSummaryStatus;
  amountDisplay: string;
  /** Caps label above the amount (e.g. “• YOU OWE”). Hidden when unsettled props omit this. */
  statusEyebrow?: string;
  /** Line under amount — active balance count. */
  activeBalancesLine?: string;
  /** Second detail line — largest counterparty hint. */
  mostlyLine?: string;
  /** Settled / empty collective state. */
  idleCaption?: string;
  accessibilityLabel: string;
};

function semanticForStatus(status: GroupBalancesViewerSummaryStatus): BalanceAmountSemantic {
  if (status === 'you_owe') return 'owe';
  if (status === 'owed_to_you') return 'owed';
  return 'neutral';
}

function eyebrowColor(
  status: GroupBalancesViewerSummaryStatus,
  palette: ReturnType<typeof useThemeColors>,
): string {
  if (status === 'you_owe') return palette.errorText;
  if (status === 'owed_to_you') return palette.successText;
  return palette.textMuted;
}

export function BalanceHero({
  status,
  amountDisplay,
  statusEyebrow,
  activeBalancesLine,
  mostlyLine,
  idleCaption,
  accessibilityLabel,
}: BalanceHeroProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View
      style={[styles.wrap, { marginHorizontal: -space.screenPadding }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      <LinearGradient
        pointerEvents="none"
        colors={[palette.overlay, 'transparent']}
        locations={[0, 1]}
        style={styles.ambient}
      />
      <View style={[styles.inner, { paddingHorizontal: space.screenPadding }]}>
        {statusEyebrow ? (
          <Text
            style={[styles.eyebrow, { color: eyebrowColor(status, palette) }]}
            accessibilityElementsHidden
          >
            {statusEyebrow}
          </Text>
        ) : null}
        <AmountDisplay text={amountDisplay} semantic={semanticForStatus(status)} role="hero" />
        {activeBalancesLine ? (
          <Text style={[styles.summary, { color: palette.textSecondary }]}>
            {activeBalancesLine}
          </Text>
        ) : null}
        {mostlyLine ? (
          <Text style={[styles.summary, { color: palette.textSecondary }]}>{mostlyLine}</Text>
        ) : null}
        {idleCaption ? (
          <Text style={[styles.summary, { color: palette.textMuted }]}>{idleCaption}</Text>
        ) : null}
      </View>
      <View style={[styles.rule, { backgroundColor: palette.borderSubtle }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: space.gapSm,
    marginBottom: space.gapMd,
    overflow: 'hidden',
  },
  ambient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 56,
    opacity: 0.45,
  },
  inner: {
    gap: space.gapXs,
    paddingTop: space.gapXs,
    paddingBottom: space.gapMd,
    zIndex: 1,
  },
  eyebrow: {
    ...textStyles.overline,
    fontSize: typography.fontSize.screenSection,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.widest,
  },
  summary: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.9,
  },
});
