import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import { textStyles, typography, useThemeColors } from '@/theme';

export type AmountIndicatorProps = {
  /** Formatted currency string (tabular). */
  amountText: string;
  align?: 'start' | 'end';
};

/** Row amount — monochrome graphite; semantics belong to `BalanceStatusLabel`. */
export function AmountIndicator({
  amountText,
  align = 'start',
}: AmountIndicatorProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Text
      style={[styles.amount, align === 'end' && styles.amountEnd, { color: palette.textPrimary }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.82}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {amountText}
    </Text>
  );
}

const styles = StyleSheet.create({
  amount: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tight,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  amountEnd: {
    textAlign: 'right',
    alignSelf: 'flex-end',
    width: '100%',
  },
});
