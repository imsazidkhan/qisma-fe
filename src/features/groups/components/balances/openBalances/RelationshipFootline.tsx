import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BalanceRelationshipPolarity } from '@/features/groups/components/balances/openBalances/BalanceStatusLabel';
import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type RelationshipFootlineProps = {
  polarity: BalanceRelationshipPolarity;
  /** Activity / expense context (mono, muted). */
  meta: string;
  statusLabel: string;
};

/**
 * Single secondary line: meta · ● status — keeps vertical rhythm tight and alignment stable.
 */
export function RelationshipFootline({
  polarity,
  meta,
  statusLabel,
}: RelationshipFootlineProps): ReactElement {
  const palette = useThemeColors();
  const dotColor = polarity === 'owe' ? palette.errorText : palette.successText;

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        style={[styles.meta, { color: palette.textMuted }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {meta}
      </Text>
      <View style={styles.tail}>
        <Text style={[styles.sep, { color: palette.borderSubtle }]}>·</Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.status, { color: palette.textMuted }]} numberOfLines={1}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: space.gapXs,
    gap: space.gapXs,
    minHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  meta: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wide,
    flex: 1,
    minWidth: 0,
  },
  tail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapXs / 2,
    flexShrink: 0,
  },
  sep: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
  },
  dot: {
    width: space.gapXs,
    height: space.gapXs,
    borderRadius: radius.full,
    opacity: 0.9,
  },
  status: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.medium,
    letterSpacing: typography.letterSpacing.tight,
    flexShrink: 0,
  },
});
