import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, typography, useThemeColors } from '@/theme';

export type SplitSheetParticipantRowProps = {
  avatarLetter: string;
  /** Optional profile image URL from roster (`GroupMemberRosterEntry.avatar`). */
  avatarUrl?: string | null;
  titleUpper: string;
  metaLine: string | null;
  amountNode: ReactNode;
  percentLine: string | null;
  isLast: boolean;
};

export function SplitSheetParticipantRow({
  avatarLetter,
  avatarUrl,
  titleUpper,
  metaLine,
  amountNode,
  percentLine,
  isLast,
}: SplitSheetParticipantRowProps): ReactElement {
  const palette = useThemeColors();
  const [imageFailed, setImageFailed] = useState(false);

  const uri = avatarUrl?.trim() ?? '';
  const showImage = uri.length > 0 && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  const onImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: space.gap,
        paddingHorizontal: space.gap,
        gap: space.gap,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: palette.borderSubtle,
      }}
      accessibilityLabel={`${titleUpper}. ${metaLine ?? ''}`}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surfaceElevated,
        }}
        accessibilityElementsHidden
      >
        {showImage ? (
          <Image
            source={{ uri }}
            style={{ width: 36, height: 36 }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            onError={onImageError}
          />
        ) : (
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.xs,
              color: palette.textSecondary,
            }}
            numberOfLines={1}
          >
            {avatarLetter.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: typography.fontSize.sm,
            color: palette.textPrimary,
            letterSpacing: typography.letterSpacing.wide,
            textTransform: 'uppercase',
          }}
          numberOfLines={1}
        >
          {titleUpper}
        </Text>
        {metaLine ? (
          <Text
            style={{
              marginTop: 2,
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {metaLine}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: 88 }}>
        <View style={{ alignItems: 'flex-end' }}>{amountNode}</View>
        {percentLine ? (
          <Text
            style={{
              marginTop: 4,
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {percentLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
