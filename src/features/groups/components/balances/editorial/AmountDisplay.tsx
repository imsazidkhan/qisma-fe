import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import { textStyles, typography, useThemeColors } from '@/theme';

export type BalanceAmountSemantic = 'owe' | 'owed' | 'neutral';

export type AmountDisplayProps = {
  text: string;
  semantic: BalanceAmountSemantic;
  /** Hero summary vs inline row amount. */
  role?: 'hero' | 'row';
};

export function AmountDisplay({ text, semantic, role = 'row' }: AmountDisplayProps): ReactElement {
  const palette = useThemeColors();
  const color =
    semantic === 'owe'
      ? palette.errorText
      : semantic === 'owed'
        ? palette.successText
        : palette.textPrimary;

  return (
    <Text
      style={[role === 'hero' ? styles.hero : styles.row, { color }]}
      numberOfLines={1}
      adjustsFontSizeToFit={role === 'row'}
      minimumFontScale={0.85}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...textStyles.numericLarge,
    fontSize: typography.fontSize['5xl'],
    lineHeight: typography.fontSize['5xl'] * typography.lineHeight.tight,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tighter,
    fontVariant: ['tabular-nums'],
  },
  row: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tight,
    fontVariant: ['tabular-nums'],
  },
});
