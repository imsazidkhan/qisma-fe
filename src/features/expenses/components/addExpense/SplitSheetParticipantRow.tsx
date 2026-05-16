import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { opacity, radius, size, space, spacing, typography, useThemeColors } from '@/theme';

export type SplitSheetParticipantRowProps = {
  avatarLetter: string;
  /** Optional profile image URL from roster (`GroupMemberRosterEntry.avatar`). */
  avatarUrl?: string | null;
  titleUpper: string;
  metaLine: string | null;
  amountNode: ReactNode;
  percentLine: string | null;
  isLast: boolean;
  /**
   * When false, the row is omitted from the accessibility tree so nested controls
   * (e.g. TextInputs) expose their own labels when focused.
   */
  includeRowInAccessibilityTree?: boolean;
  /** Subtle press feedback for read-only rows (e.g. equal split). */
  onRowPress?: () => void;
  /** Equal split: more vertical padding so single-line rows match perceived rhythm of other tabs. */
  rowVerticalDensity?: 'compact' | 'comfortable';
};

export function SplitSheetParticipantRow({
  avatarLetter,
  avatarUrl,
  titleUpper,
  metaLine,
  amountNode,
  percentLine,
  isLast,
  includeRowInAccessibilityTree = true,
  onRowPress,
  rowVerticalDensity = 'compact',
}: SplitSheetParticipantRowProps): ReactElement {
  const palette = useThemeColors();
  const [imageFailed, setImageFailed] = useState(false);

  const rowPaddingVertical = rowVerticalDensity === 'comfortable' ? space.gap : spacing['0.5'];

  const uri = avatarUrl?.trim() ?? '';
  const showImage = uri.length > 0 && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  const onImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  const rowContent = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rowPaddingVertical,
        paddingLeft: space.gapXs,
        paddingRight: spacing['2.5'],
        gap: space.gapXs,
      }}
      accessible={includeRowInAccessibilityTree && !onRowPress ? undefined : false}
      {...(includeRowInAccessibilityTree && !onRowPress
        ? { accessibilityLabel: `${titleUpper}. ${metaLine ?? ''}` }
        : {})}
    >
      <View
        style={{
          width: size.avatarXs,
          height: size.avatarXs,
          borderRadius: radius.full,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surfaceFloating,
        }}
        accessibilityElementsHidden
      >
        {showImage ? (
          <Image
            source={{ uri }}
            style={{ width: size.avatarXs, height: size.avatarXs }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            onError={onImageError}
          />
        ) : (
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: palette.textSecondary,
            }}
            numberOfLines={1}
          >
            {avatarLetter.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: palette.textPrimary,
            letterSpacing: typography.letterSpacing.tight,
          }}
          numberOfLines={1}
        >
          {titleUpper}
        </Text>
        {metaLine ? (
          <View
            style={{
              marginTop: space.iconGapSm,
              alignSelf: 'flex-start',
              paddingVertical: spacing.px,
              paddingHorizontal: spacing['0.5'],
              borderRadius: radius.full,
              backgroundColor: palette.overlay,
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.medium,
                fontSize: typography.fontSize['2xs'],
                fontWeight: typography.fontWeight.medium,
                color: palette.textSecondary,
                letterSpacing: typography.letterSpacing.normal,
              }}
              numberOfLines={1}
            >
              {metaLine}
            </Text>
          </View>
        ) : null}
      </View>
      <View
        style={{
          alignItems: 'flex-end',
          justifyContent: 'center',
          minWidth: 72,
        }}
      >
        <View style={{ alignItems: 'flex-end' }}>{amountNode}</View>
        {percentLine ? (
          <Text
            style={{
              marginTop: space.iconGapSm,
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              fontWeight: typography.fontWeight.regular,
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

  return (
    <View collapsable={false}>
      {onRowPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            includeRowInAccessibilityTree ? `${titleUpper}. ${metaLine ?? ''}` : undefined
          }
          onPress={onRowPress}
          style={({ pressed }) => ({
            backgroundColor: pressed ? palette.surfaceFloating : 'transparent',
            opacity: pressed ? opacity.high : opacity.opaque,
          })}
        >
          {rowContent}
        </Pressable>
      ) : (
        rowContent
      )}
      {!isLast ? (
        <View
          style={{
            marginLeft: space.gapXs,
            marginRight: spacing['2.5'],
            height: StyleSheet.hairlineWidth,
            backgroundColor: palette.borderSubtle,
            opacity: opacity.subtle,
          }}
        />
      ) : null}
    </View>
  );
}
