import { BlurView } from 'expo-blur';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { radius, space, textStyles, typography, useThemeColors, useThemeMode } from '@/theme';

export type StickySettleCTAProps = {
  visible: boolean;
  eyebrow: string;
  amountDisplay: string;
  onPress: () => void;
  accessibilityLabel: string;
};

export function StickySettleCTA({
  visible,
  eyebrow,
  amountDisplay,
  onPress,
  accessibilityLabel,
}: StickySettleCTAProps): ReactElement | null {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const insets = useSafeAreaInsets();
  const blurTint = themeMode === 'dark' ? 'dark' : 'light';

  if (!visible) {
    return null;
  }

  const underlay = themeMode === 'dark' ? palette.surfaceElevated : palette.sheetBackground;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.gapMd) }]}
    >
      <View style={[styles.shell, { borderTopColor: palette.border }]}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: underlay }]}
        />
        <BlurView
          intensity={themeMode === 'dark' ? 38 : 28}
          tint={blurTint}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={[StyleSheet.absoluteFillObject, styles.blurClip]}
        />
        <View style={[styles.innerHairline, { borderColor: palette.borderStrong }]} />
        <View style={styles.row}>
          <View style={styles.copyCol}>
            <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
              {eyebrow.toUpperCase()}
            </Text>
            <Text style={[styles.amount, { color: palette.textPrimary }]}>{amountDisplay}</Text>
          </View>
          <View
            style={[
              styles.accentHost,
              {
                backgroundColor: palette.accent,
                borderColor: palette.accent,
              },
            ]}
          >
            <Button
              label={t('groups.detail.balanceStickySettleCta')}
              variant="accent"
              accentSlab="parent"
              trailing="none"
              labelCase="uppercase"
              fullWidth
              haptic
              onPress={onPress}
              accessibilityLabel={accessibilityLabel}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  shell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: space.gapMd,
    paddingHorizontal: space.screenPadding,
    gap: space.gapMd,
    position: 'relative',
  },
  blurClip: {
    opacity: 0.92,
  },
  innerHairline: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: space.gapMd,
    marginVertical: space.gapSm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.55,
    pointerEvents: 'none',
  },
  row: {
    gap: space.gapMd,
    zIndex: 2,
  },
  copyCol: {
    gap: space.gapXs,
    alignSelf: 'stretch',
  },
  eyebrow: {
    ...textStyles.overline,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
  },
  amount: {
    ...textStyles.numericLarge,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.mono.medium,
    fontVariant: ['tabular-nums'],
    letterSpacing: typography.letterSpacing.tight,
  },
  accentHost: {
    alignSelf: 'stretch',
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
