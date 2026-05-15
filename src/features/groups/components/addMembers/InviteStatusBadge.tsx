import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, typography } from '@/theme';

export type InviteStatusBadgeProps = {
  label: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

export function InviteStatusBadge({
  label,
  borderColor,
  backgroundColor,
  textColor,
}: InviteStatusBadgeProps): ReactElement {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        marginTop: space.gapXs,
        paddingHorizontal: space.gapSm,
        paddingVertical: space.gapXs,
        borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor,
        backgroundColor,
      }}
    >
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.fontSize['2xs'] * 0.16,
          textTransform: 'uppercase',
          color: textColor,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
