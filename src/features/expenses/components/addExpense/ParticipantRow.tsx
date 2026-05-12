import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ParticipantStatusChip } from '@/features/expenses/components/addExpense/ParticipantStatusChip';
import type { ParticipantPreviewStatus } from '@/features/expenses/utils/computeParticipantPreview';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { radius, size, space, typography, useThemeColors } from '@/theme';

export type ParticipantRowProps = {
  name: string;
  contextLine: string;
  initial: string;
  avatarUri?: string | null;
  amountMajor: string | null;
  currency: string;
  status: ParticipantPreviewStatus;
  onPress?: () => void;
};

export function ParticipantRow({
  name,
  contextLine,
  initial,
  avatarUri,
  amountMajor,
  currency,
  status,
  onPress,
}: ParticipantRowProps): ReactElement {
  const palette = useThemeColors();

  const amountLabel =
    amountMajor !== null ? formatExpenseMajorAmount(amountMajor.replace(/,/g, ''), currency) : '—';

  const a11y = `${name}. ${contextLine}. ${amountLabel}`;

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.gapMd,
        paddingVertical: space.gapMd,
        paddingHorizontal: space.paddingMd,
      }}
    >
      <View
        style={{
          width: size.avatar,
          height: size.avatar,
          borderRadius: radius.full,
          backgroundColor: palette.textPrimary,
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
              color: palette.textInverse,
              letterSpacing: 0,
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
            fontSize: typography.fontSize.md,
            color: palette.textPrimary,
          }}
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            marginTop: space.gapXs,
            fontFamily: typography.fontFamily.sans.regular,
            fontSize: typography.fontSize.xs,
            color: palette.textMuted,
          }}
        >
          {contextLine}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: space.gapSm }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize.md,
            color: palette.textPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {amountLabel}
        </Text>
        <ParticipantStatusChip status={status} />
      </View>
    </View>
  );

  const cardStyle = {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.white,
    overflow: 'hidden' as const,
  };

  if (!onPress) {
    return (
      <View accessibilityLabel={a11y} style={cardStyle}>
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.85 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}
