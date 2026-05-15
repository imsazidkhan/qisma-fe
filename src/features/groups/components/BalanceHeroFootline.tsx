import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import type { GroupBalancesViewerSummaryStatus } from '@/features/groups/types/groupBalancesViewer.types';
import { textStyles, typography, useThemeColors } from '@/theme';

export type BalanceHeroFootlineProps = {
  count: number;
  status: GroupBalancesViewerSummaryStatus;
};

/**
 * Group-level aggregate only — open settlement edge count.
 * No member names or owed-to-you copy (those belong in the OPEN BALANCES list).
 */
export function BalanceHeroFootline({ count, status }: BalanceHeroFootlineProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();

  if (count === 0) {
    return (
      <Text
        style={[styles.mono, styles.wrap, { color: palette.textMuted }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {t('groups.detail.balanceHeroFootlineNone')}
      </Text>
    );
  }

  const prefixColor = status === 'owed_to_you' ? palette.successText : palette.textSecondary;

  return (
    <Text
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.mono, { color: prefixColor }]}>+{count}</Text>
      <Text style={[styles.mono, { color: palette.textMuted }]}>
        {' '}
        {t('groups.detail.balanceHeroFootlineSuffix')}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  mono: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
