import { type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/theme';
import { useThemeColors } from '@/theme/ThemeProvider';

const HEADER_ICON_SIZE = 38;

/** Matches `Ionicons` `size` on the hub profile trigger. */
export const GROUPS_HUB_PROFILE_GLYPH_SIZE = 15;

export function GroupsHubProfileIconButton({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: ReactNode;
}): ReactElement {
  const palette = useThemeColors();

  const fill = 'transparent';
  const border = palette.borderDivider;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={spacing['2']}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.iconDisk,
            {
              backgroundColor: fill,
              borderColor: border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

export type GroupsPremiumHeaderProps = {
  dateLine: string;
};

export function GroupsPremiumHeader({ dateLine }: GroupsPremiumHeaderProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View style={styles.root}>
      <Text style={[styles.date, { color: palette.textSecondary }]} numberOfLines={1}>
        {dateLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
  },
  date: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.md * typography.lineHeight.snug,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  iconDisk: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
