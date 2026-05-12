import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { radius, space, typography, useThemeColors } from '@/theme';

export function SplitPreviewGroup({ children }: { children: ReactNode }): ReactElement {
  const palette = useThemeColors();
  return (
    <View
      style={{
        borderRadius: radius.inviteCard,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.borderSubtle,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

export type SplitPreviewRowProps = {
  label: string;
  amountMajor: string;
  currency: string;
  /** When true, renders as a row inside {@link SplitPreviewGroup} (hairline separators). */
  grouped?: boolean;
  isLast?: boolean;
};

export function SplitPreviewRow({
  label,
  amountMajor,
  currency,
  grouped = false,
  isLast = false,
}: SplitPreviewRowProps): ReactElement {
  const palette = useThemeColors();
  const amt = formatExpenseMajorAmount(amountMajor.replace(/,/g, ''), currency);

  if (grouped) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: space.gapMd,
          paddingHorizontal: space.gapMd,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: palette.borderSubtle,
          backgroundColor: palette.premiumCardSurface,
          gap: space.gapMd,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: typography.fontFamily.sans.medium,
            fontSize: typography.fontSize.md,
            color: palette.textPrimary,
          }}
          numberOfLines={1}
        >
          👤 {label}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize.sm,
            color: palette.textSecondary,
          }}
        >
          {amt}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: space.gap,
        paddingHorizontal: space.gapMd,
        borderRadius: radius.inviteCard,
        backgroundColor: palette.premiumCardSurface,
        gap: space.gapMd,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: typography.fontFamily.sans.medium,
          fontSize: typography.fontSize.md,
          color: palette.textPrimary,
        }}
        numberOfLines={1}
      >
        👤 {label}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize.sm,
          color: palette.textSecondary,
        }}
      >
        {amt}
      </Text>
    </View>
  );
}
