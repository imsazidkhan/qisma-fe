import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, textStyles, typography, useThemeColors } from '@/theme';

export type RelationshipMetaProps = {
  text: string;
  /** Omit top offset when stacked in a layout that supplies vertical gap. */
  dense?: boolean;
};

/** Editorial metadata line — activity, expense count, recency. */
export function RelationshipMeta({ text, dense = false }: RelationshipMetaProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Text
      style={[styles.meta, dense && styles.metaDense, { color: palette.textMuted }]}
      numberOfLines={dense ? 1 : 2}
      ellipsizeMode="tail"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  meta: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    marginTop: space.gapXs / 2,
  },
  metaDense: {
    marginTop: 0,
  },
});
