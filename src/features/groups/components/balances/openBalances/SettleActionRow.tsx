import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type SettleActionRowProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
};

/** Primary settle control inside expanded balance detail — outlined, not a loud slab. */
export function SettleActionRow({
  label,
  accessibilityLabel,
  onPress,
}: SettleActionRowProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.shell,
        {
          borderColor: palette.borderSubtle,
          backgroundColor: pressed ? palette.overlay : 'transparent',
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapLg,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...textStyles.label,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
});
