import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ResolvedExpenseFeedCategoryVisual } from '@/features/expenses/utils/resolveExpenseFeedCategoryVisual';
import { radius, size } from '@/theme';
import type { useThemeColors } from '@/theme';

const OUTER = 44;
const ICON_INNER = Math.round(size.icon);

export type ExpenseDetailMonoCategoryIconProps = {
  visual: ResolvedExpenseFeedCategoryVisual;
  palette: ReturnType<typeof useThemeColors>;
};

/**
 * Category glyph for expense detail — monochrome shell (Nothing-style); icon resolved from category tiers / title.
 */
export function ExpenseDetailMonoCategoryIcon({
  visual,
  palette,
}: ExpenseDetailMonoCategoryIconProps): ReactElement {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surfaceElevated,
          borderColor: palette.borderSubtle,
        },
      ]}
    >
      {visual.kind === 'remote' ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={{ uri: visual.uri }}
          style={[styles.iconImg, { opacity: 0.92 }]}
        />
      ) : visual.kind === 'emoji' ? (
        <Text allowFontScaling={false} style={[styles.emoji, { color: palette.textSecondary }]}>
          {visual.emoji}
        </Text>
      ) : (
        <Ionicons color={palette.iconMuted} name={visual.iconGlyph} size={ICON_INNER} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: OUTER,
    height: OUTER,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconImg: {
    width: ICON_INNER,
    height: ICON_INNER,
  },
  emoji: {
    fontSize: Math.round(ICON_INNER * 0.72),
    lineHeight: Math.round(ICON_INNER * 0.92),
    textAlign: 'center',
  },
});
