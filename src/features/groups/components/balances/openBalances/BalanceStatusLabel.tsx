import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type BalanceRelationshipPolarity = 'owe' | 'owed';

export type BalanceStatusLabelProps = {
  polarity: BalanceRelationshipPolarity;
  label: string;
  dense?: boolean;
  /** Right-align the dot + label cluster (second column under amounts). */
  trailing?: boolean;
};

/** Sentence-case relationship cue — semantic colour lives on the dot only. */
export function BalanceStatusLabel({
  polarity,
  label,
  dense = false,
  trailing = false,
}: BalanceStatusLabelProps): ReactElement {
  const palette = useThemeColors();
  const dot = polarity === 'owe' ? palette.errorText : palette.successText;

  return (
    <View
      style={[styles.row, dense && styles.rowDense, trailing && styles.rowTrailing]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: palette.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapXs,
    marginTop: space.gapXs / 2,
    alignSelf: 'flex-start',
  },
  rowDense: {
    marginTop: 0,
  },
  rowTrailing: {
    alignSelf: 'flex-end',
  },
  dot: {
    width: space.gapXs,
    height: space.gapXs,
    borderRadius: radius.full,
    opacity: 0.92,
  },
  label: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.medium,
    letterSpacing: typography.letterSpacing.tight,
  },
});
