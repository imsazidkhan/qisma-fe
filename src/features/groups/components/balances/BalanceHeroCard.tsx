import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import type { GroupBalancesViewerSummaryStatus } from '@/features/groups/types/groupBalancesViewer.types';
import { useTranslation } from 'react-i18next';
import {
  duration,
  easing,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

type BalancePalette = ReturnType<typeof useThemeColors>;

export type BalanceHeroCardProps = {
  eyebrow: string;
  status: GroupBalancesViewerSummaryStatus;
  amountDisplay: string;
  activeBalanceCount: number;
  largestPeer?: { name: string; amountDisplay: string };
  mostlyLine?: string;
  accessibilityLabel: string;
};

function glyphColor(palette: BalancePalette, status: GroupBalancesViewerSummaryStatus): string {
  if (status === 'settled') {
    return palette.textMuted;
  }
  if (status === 'owed_to_you') {
    return palette.successText;
  }
  return palette.errorText;
}

function amountColor(palette: BalancePalette, status: GroupBalancesViewerSummaryStatus): string {
  if (status === 'settled') {
    return palette.textPrimary;
  }
  if (status === 'owed_to_you') {
    return palette.successText;
  }
  return palette.textPrimary;
}

export function BalanceHeroCard({
  eyebrow,
  status,
  amountDisplay,
  activeBalanceCount,
  largestPeer,
  mostlyLine,
  accessibilityLabel,
}: BalanceHeroCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const reduceMotion = useReducedMotion();
  const blurTint = themeMode === 'dark' ? 'dark' : 'light';
  const glyph = glyphColor(palette, status);
  const primary = amountColor(palette, status);
  const dotsOpacity = useSharedValue(0.14);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(dotsOpacity);
      dotsOpacity.value = 0.14;
      return;
    }
    dotsOpacity.value = withRepeat(
      withSequence(
        withTiming(0.09, { duration: duration.slower.ms, easing: easing.standard.rn }),
        withTiming(0.18, { duration: duration.slower.ms, easing: easing.standard.rn }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(dotsOpacity);
  }, [dotsOpacity, reduceMotion]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));

  const footMono =
    activeBalanceCount === 0
      ? null
      : (() => {
          const prefixColor =
            status === 'owed_to_you' ? palette.successText : palette.textSecondary;
          return (
            <Text
              style={styles.footWrap}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={[styles.footMono, { color: prefixColor }]}>{activeBalanceCount}</Text>
              <Text style={[styles.footMono, { color: palette.textMuted }]}>
                {' '}
                · {t('groups.detail.balanceHeroCardRelationshipSuffix')}
              </Text>
            </Text>
          );
        })();

  return (
    <View
      style={[styles.shell, { borderColor: palette.borderFrost }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      <BlurView
        intensity={themeMode === 'dark' ? 28 : 52}
        tint={blurTint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[palette.overlayMedium, palette.overlay, 'transparent']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[StyleSheet.absoluteFillObject, dotAnimatedStyle]} pointerEvents="none">
        <BalanceDotMatrixTexture dotColor={palette.textPrimary} />
      </Animated.View>

      <View style={[styles.innerHairline, { borderColor: palette.overlayHeavy }]} />

      <View style={styles.inner}>
        <View style={styles.labelRow}>
          <View
            style={[styles.dot, { backgroundColor: glyph }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text
            style={[styles.eyebrow, { color: palette.textMuted }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {eyebrow.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.amount, { color: primary }]}>{amountDisplay}</Text>

        {mostlyLine ? (
          <Text style={[styles.mostly, { color: palette.textSecondary }]} numberOfLines={2}>
            {mostlyLine}
          </Text>
        ) : null}

        {largestPeer ? (
          <View style={[styles.largestRow, { borderTopColor: palette.borderSubtle }]}>
            <Text style={[styles.largestKicker, { color: palette.textMuted }]}>
              {t('groups.detail.balanceHeroLargestKicker')}
            </Text>
            <Text style={[styles.largestBody, { color: palette.textPrimary }]} numberOfLines={1}>
              {largestPeer.name}
              <Text style={{ color: palette.textMuted }}> · </Text>
              <Text style={[styles.largestAmt, { color: palette.textPrimary }]}>
                {largestPeer.amountDisplay}
              </Text>
            </Text>
          </View>
        ) : null}

        {footMono}

        {activeBalanceCount === 0 ? (
          <Text style={[styles.footMono, styles.settledFoot, { color: palette.textMuted }]}>
            {t('groups.detail.balanceHeroAllSettledRelationships')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    borderRadius: radius.inviteCard,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: space.gapSm,
  },
  innerHairline: {
    ...StyleSheet.absoluteFillObject,
    margin: space.gapXs,
    borderRadius: radius.inviteCard - space.gapXs,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.65,
    pointerEvents: 'none',
  },
  inner: {
    paddingTop: space.gapLg,
    paddingBottom: space.gapLg,
    paddingHorizontal: space.paddingLg,
    gap: space.gapXs,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  eyebrow: {
    ...textStyles.overline,
    flex: 1,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  amount: {
    ...textStyles.numericLarge,
    fontSize: typography.fontSize['5xl'],
    lineHeight: typography.fontSize['5xl'] * typography.lineHeight.tight,
    fontVariant: ['tabular-nums'],
    marginTop: space.gapSm,
    letterSpacing: typography.letterSpacing.tighter,
  },
  mostly: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.medium,
    marginTop: space.gapXs,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  largestRow: {
    alignSelf: 'stretch',
    marginTop: space.gapMd,
    paddingTop: space.gapMd,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space.gapXs,
  },
  largestKicker: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  largestBody: {
    ...textStyles.body,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.medium,
  },
  largestAmt: {
    fontFamily: typography.fontFamily.mono.medium,
    fontVariant: ['tabular-nums'],
  },
  footWrap: {
    marginTop: space.gapMd,
    alignSelf: 'flex-start',
  },
  footMono: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  settledFoot: {
    marginTop: space.gapMd,
  },
});
