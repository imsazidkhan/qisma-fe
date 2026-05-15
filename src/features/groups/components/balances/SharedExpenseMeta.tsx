import type { ReactElement } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { space, textStyles, typography, useThemeColors } from '@/theme';

export type SharedExpenseMetaProps = {
  primary?: string;
  secondary?: string;
  /** Tighter top inset when the meta sits directly under a dense title row. */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Compact relationship / activity lines — mono, low emphasis. */
export function SharedExpenseMeta({
  primary,
  secondary,
  dense,
  style,
}: SharedExpenseMetaProps): ReactElement {
  const palette = useThemeColors();
  if (!primary && !secondary) {
    return <View />;
  }

  return (
    <View style={[styles.col, dense ? styles.colDense : null, style]}>
      {primary ? (
        <Text style={[styles.line, { color: palette.textMuted }]} numberOfLines={1}>
          {primary}
        </Text>
      ) : null}
      {secondary ? (
        <Text style={[styles.line, styles.dim, { color: palette.textMuted }]} numberOfLines={2}>
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    alignSelf: 'stretch',
    gap: space.gapXs / 2,
    marginTop: space.gapXs,
  },
  colDense: {
    marginTop: space.gapXs / 2,
  },
  line: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  dim: {
    opacity: 0.92,
  },
});
