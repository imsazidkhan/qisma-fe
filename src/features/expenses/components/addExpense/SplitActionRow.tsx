import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, typography, useThemeColors } from '@/theme';

export type SplitActionRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * - `embedded` — flat row inside a parent card.
   * - `prominent` — bordered control; use for primary split entry.
   * - `standalone` — rounded floating row (legacy).
   */
  variant?: 'standalone' | 'embedded' | 'prominent';
};

/** Trailing chevron strip width — shared with schedule row for alignment. */
export const SPLIT_ACTION_CHEVRON_SLOT_W = 28;

export function SplitActionRow({
  title,
  subtitle,
  onPress,
  variant = 'standalone',
  accessibilityLabel,
  accessibilityHint,
}: SplitActionRowProps): ReactElement {
  const palette = useThemeColors();
  const embedded = variant === 'embedded';
  const prominent = variant === 'prominent';

  const titleSize = typography.fontSize.md;
  const titleLineHeight = titleSize * typography.lineHeight.snug;
  const chevronSize = 18;
  const chevronColor = palette.iconMuted;

  const horizontalPad = embedded ? 0 : space.gap;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        position: 'relative',
        alignSelf: 'stretch',
        width: '100%',
        paddingLeft: horizontalPad,
        paddingRight: horizontalPad + SPLIT_ACTION_CHEVRON_SLOT_W,
        paddingVertical: prominent ? space.gapSm : space.gapMd,
        borderRadius: embedded ? 0 : prominent ? radius.lg : radius['2xl'],
        borderWidth: prominent ? StyleSheet.hairlineWidth : 0,
        borderColor: prominent ? palette.borderSubtle : 'transparent',
        backgroundColor: embedded ? 'transparent' : palette.surfaceFloating,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <View style={{ gap: subtitle ? space.gapXs : 0, maxWidth: '100%' }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: titleSize,
            lineHeight: titleLineHeight,
            letterSpacing: 0,
            color: palette.textPrimary,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: typography.fontFamily.sans.regular,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.fontSize.sm * 1.25,
              color: palette.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: horizontalPad,
          top: 0,
          bottom: 0,
          width: SPLIT_ACTION_CHEVRON_SLOT_W,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="chevron-forward" size={chevronSize} color={chevronColor} />
      </View>
    </Pressable>
  );
}
