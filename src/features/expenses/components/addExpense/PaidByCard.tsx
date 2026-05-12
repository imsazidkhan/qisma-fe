import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, size, space, typography, useThemeColors } from '@/theme';

export type PaidByCardProps = {
  /** Display name (already localised — "You" / "Ananya"). */
  name: string;
  /** Subtle support line under the name (e.g. "Paid the full amount"). */
  contextLine: string;
  /** First initial used when no avatar is set. */
  initial: string;
  avatarUri?: string | null;
  onPress: () => void;
  accessibilityLabel: string;
  /** Show a hairline error tint on the row when validation fails. */
  hasError?: boolean;
};

/**
 * Touchable "Paid by" card. Visual: 1-px hairline border, modest 20px radius,
 * avatar + two-line stack + chevron. No fill, no shadow — keeps the chrome
 * thin so the amount hero above stays the visual lead.
 */
export function PaidByCard({
  name,
  contextLine,
  initial,
  avatarUri,
  onPress,
  accessibilityLabel,
  hasError = false,
}: PaidByCardProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.gapMd,
        paddingVertical: space.gap,
        paddingHorizontal: space.gapMd,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: hasError ? palette.warningBorder : palette.border,
        borderRadius: radius.xl,
        backgroundColor: palette.surfaceBase,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: size.avatar,
          height: size.avatar,
          borderRadius: radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.sm,
              color: palette.textPrimary,
            }}
          >
            {initial}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: typography.fontSize.lg,
            color: palette.textPrimary,
          }}
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 2,
            fontFamily: typography.fontFamily.sans.regular,
            fontSize: typography.fontSize.xs,
            color: palette.textMuted,
          }}
        >
          {contextLine}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={palette.iconMuted} />
    </Pressable>
  );
}
