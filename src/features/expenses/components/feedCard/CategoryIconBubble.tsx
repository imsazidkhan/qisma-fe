import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ResolvedExpenseFeedCategoryVisual } from '@/features/expenses/utils/resolveExpenseFeedCategoryVisual';
import { borderWidth, radius, spacing } from '@/theme';
import type { useThemeColors } from '@/theme';

/** Compact category dock — 44 dp (`spacing['11']`), Wallet-aligned. */
export const CATEGORY_ICON_BUBBLE_SIZE = spacing['11'];

export type CategoryIconBubbleProps = {
  visual: ResolvedExpenseFeedCategoryVisual;
  palette: ReturnType<typeof useThemeColors>;
};

const ICON_INNER = 20;

export function CategoryIconBubble({ visual, palette }: CategoryIconBubbleProps): ReactElement {
  const ionTint =
    visual.kind === 'ion' ? (visual.colorOverride?.fg ?? palette[visual.fgToken]) : undefined;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.wrap,
        {
          backgroundColor: palette.expenseLedgerCategoryDockBg,
          borderColor: palette.expenseLedgerCardHairline,
          borderWidth: borderWidth.hairline,
        },
      ]}
    >
      {visual.kind === 'remote' ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={{ uri: visual.uri }}
          style={styles.iconImg}
        />
      ) : visual.kind === 'emoji' ? (
        <Text allowFontScaling={false} style={styles.emoji}>
          {visual.emoji}
        </Text>
      ) : (
        <Ionicons color={ionTint} name={visual.iconGlyph} size={ICON_INNER} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: CATEGORY_ICON_BUBBLE_SIZE,
    height: CATEGORY_ICON_BUBBLE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
