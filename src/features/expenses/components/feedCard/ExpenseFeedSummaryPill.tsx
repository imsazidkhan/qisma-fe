import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, size, spacing, typography } from '@/theme';
import type { useThemeColors } from '@/theme';

export type ExpenseFeedSummaryPillProps = {
  label: string;
  palette: ReturnType<typeof useThemeColors>;
  /** Matches reference “person + group” chips — tune only when semantics change. */
  leftIcon?: ComponentProps<typeof Ionicons>['name'];
  rightIcon?: ComponentProps<typeof Ionicons>['name'];
};

/** Ledger summary capsule — dual glyph + muted sentence (reference expense-row pill). */
export function ExpenseFeedSummaryPill({
  label,
  palette,
  leftIcon = 'person-outline',
  rightIcon = 'people-outline',
}: ExpenseFeedSummaryPillProps): ReactElement {
  const glyph = size.iconXs + spacing['0.5'];
  const muted = palette.iconMuted;

  return (
    <View
      accessibilityRole="text"
      style={[styles.shell, { backgroundColor: palette.expenseFeedMetaChipSurface }]}
    >
      <View style={styles.glyphPair}>
        <Ionicons
          name={leftIcon}
          size={glyph}
          color={muted}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Ionicons
          name={rightIcon}
          size={glyph}
          color={muted}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <Text
        style={[styles.copy, { color: palette.textMuted }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing['1.5'],
    maxWidth: '100%',
    paddingVertical: spacing['1.5'],
    paddingHorizontal: spacing['3'],
    borderRadius: radius.full,
    minHeight: spacing['8'],
  },
  glyphPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  copy: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: spacing['3'] + spacing['1.5'],
    letterSpacing: typography.letterSpacing.normal,
  },
});
