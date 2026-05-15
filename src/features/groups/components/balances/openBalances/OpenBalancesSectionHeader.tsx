import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, textStyles, typography, useThemeColors } from '@/theme';

export type OpenBalancesSectionHeaderProps = {
  titleNoCount: string;
  titleWithCount: string;
  count: number;
};

/** Editorial section kicker — uppercase, tracked, graphite. */
export function OpenBalancesSectionHeader({
  titleNoCount,
  titleWithCount,
  count,
}: OpenBalancesSectionHeaderProps): ReactElement {
  const palette = useThemeColors();
  const label = count > 0 ? titleWithCount : titleNoCount;

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={[styles.kicker, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: space.sectionGapSm,
    marginBottom: space.gapMd,
  },
  kicker: {
    ...textStyles.overline,
    fontSize: typography.fontSize.screenSection,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
});
