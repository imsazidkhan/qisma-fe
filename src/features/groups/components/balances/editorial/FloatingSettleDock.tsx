import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, textStyles, typography, useThemeColors, useThemeMode } from '@/theme';

export type FloatingSettleDockProps = {
  visible: boolean;
  canvasColor: string;
  /** Shown at the trailing edge of the primary pill (e.g. net you owe). */
  amountDisplay: string;
  onPress: () => void;
  accessibilityLabel: string;
  /** Secondary chrome — balances sorting / filters (optional UX stub). */
  onFilterPress?: () => void;
};

/** Bottom blur dock: optional filter control + pill combining settle + amount. */
export function FloatingSettleDock({
  visible,
  canvasColor,
  amountDisplay,
  onPress,
  accessibilityLabel,
  onFilterPress,
}: FloatingSettleDockProps): ReactElement | null {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const insets = useSafeAreaInsets();
  const blurTint = themeMode === 'dark' ? 'dark' : 'light';
  const isLight = themeMode === 'light';
  /** Solid slab reads reliably over the frosted bar (light blur can mute filled accent). */
  const pillBg = isLight ? palette.textPrimary : palette.accent;
  const pillFg = isLight ? palette.balancesCanvas : palette.textOnAccent;
  const pillBorder = isLight ? palette.borderStrong : palette.accent;

  if (!visible) {
    return null;
  }

  const bottomPad = Math.max(insets.bottom, space.gapMd);

  const fireLight = (): Promise<void> =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => Promise.resolve());

  return (
    <View pointerEvents="box-none" style={styles.anchor}>
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', canvasColor]}
        locations={[0.12, 1]}
        style={styles.fade}
      />
      <View
        style={[styles.bar, { paddingBottom: bottomPad, borderTopColor: palette.borderSubtle }]}
      >
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: canvasColor, opacity: isLight ? 0.62 : 0.78 },
          ]}
        />
        <BlurView
          intensity={themeMode === 'dark' ? 34 : 18}
          tint={blurTint}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={[StyleSheet.absoluteFillObject, { opacity: isLight ? 0.72 : 0.88 }]}
        />
        <View style={styles.content}>
          <View style={styles.toolbar}>
            {onFilterPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.detail.balanceDockFilterA11y')}
                hitSlop={12}
                onPress={() => {
                  void fireLight();
                  onFilterPress();
                }}
                style={({ pressed }) => [
                  styles.filterBtn,
                  {
                    borderColor: palette.borderSubtle,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Ionicons name="options-outline" size={20} color={palette.textSecondary} />
              </Pressable>
            ) : (
              <View style={styles.filterSpacer} />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={() => {
                void fireLight();
                onPress();
              }}
              style={({ pressed }) => [
                styles.pill,
                {
                  backgroundColor: pillBg,
                  borderColor: pillBorder,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.pillLabel, { color: pillFg }]}>
                {t('groups.detail.balanceStickySettleCta')}
              </Text>
              <View style={styles.pillTrail}>
                <Text style={[styles.pillAmount, { color: pillFg }]} numberOfLines={1}>
                  {amountDisplay}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={pillFg} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    height: 48,
    marginBottom: -6,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: space.gapMd,
    paddingHorizontal: space.screenPaddingLg,
    position: 'relative',
  },
  content: {
    zIndex: 2,
    alignSelf: 'stretch',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSpacer: {
    width: 44,
    height: 44,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gapMd,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapLg,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillLabel: {
    ...textStyles.label,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.semiBold,
    flexShrink: 0,
  },
  pillTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapXs,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  pillAmount: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tight,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
});
