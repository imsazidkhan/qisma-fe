import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type BalanceChipTone = 'owe' | 'owed' | 'settled';

export type BalanceStatusChipProps = {
  tone: BalanceChipTone;
  label: string;
};

export function BalanceStatusChip({ tone, label }: BalanceStatusChipProps): ReactElement {
  const palette = useThemeColors();

  const border =
    tone === 'owe'
      ? palette.errorBorder
      : tone === 'owed'
        ? palette.successBorder
        : palette.borderSubtle;
  const bg =
    tone === 'owe'
      ? palette.errorSubtle
      : tone === 'owed'
        ? palette.successSubtle
        : palette.overlay;
  const fg =
    tone === 'owe' ? palette.errorText : tone === 'owed' ? palette.successText : palette.textMuted;

  return (
    <View style={[styles.shell, { borderColor: border, backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'flex-start',
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapSm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
});
