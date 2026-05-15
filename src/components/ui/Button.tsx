import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { radius, space, typography, useThemeColors } from '@/theme';
import { scale as scaleMotion, spring } from '@/theme/motion';

/**
 * Primary actions and navigation. Variants:
 *
 *   - `secondary` (default): hairline border, transparent fill — calm.
 *   - `primary`: filled with `textPrimary`, label uses `background` (inverse
 *     slab). Reserve for the main action when it must stay monochrome.
 *   - `accent`: filled with `accent`, label `textOnAccent` — the single
 *     hero CTA on a screen. Use `accentSlab="parent"` when a wrapping `View`
 *     supplies the accent fill for reliable contrast on all themes.
 *     Optional `ctaProminence="expressive"` bumps size, pill radius, and label
 *     weight for docked / hero CTAs (pairs with `labelCase="none"`).
 *
 * Layout: with `trailing="arrow"`, label and arrow pin to the edges — reads as
 * "go forward". With `trailing="none"`, the label is centered by default for
 * accent CTAs.
 *
 * Disabled state is INTENTIONALLY readable, never "faded into nothing":
 *   - `primary` disabled → soft `surfaceElevated` + `border` + muted label.
 *   - `accent` disabled → `surfaceOverlay` + `borderStrong` + muted label.
 *   - `secondary` disabled → outlined frame at `border` + muted label.
 * In both palettes (light and dark) the disabled button stays a clearly
 * delimited rectangle. We learned the hard way that a `borderSubtle` frame
 * + transparent fill in LIGHT mode is essentially `#EAEAEA` on `#F4F4F4`
 * — i.e. invisible — so the touch target was there but the UI looked empty.
 *
 * Includes a light haptic on press (best-effort; silent on platforms /
 * runtimes where `expo-haptics` isn't available). Set `haptic={false}` to
 * suppress (e.g. inside a list of repeating taps).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'accent';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  /** `'arrow'` renders `→`, `'none'` renders nothing. */
  trailing?: 'arrow' | 'none';
  /**
   * `'between'` — label and arrow pin to edges (default when `trailing="arrow"`).
   * `'center'` — label [+ arrow] as a centered cluster (hero CTAs).
   * When omitted, `accent` + `trailing="none"` defaults to centered label.
   */
  contentAlign?: 'between' | 'center';
  /** Default sentence case. Use `uppercase` only for rare technical chrome. */
  labelCase?: 'uppercase' | 'none';
  /**
   * `'intrinsic'` (default) — this `Pressable` paints `palette.accent`.
   * `'parent'` — outer `View` should set `backgroundColor: palette.accent`; inner
   * fill stays transparent (fixes dark-theme cases where the pressable slab
   * did not composite and label read as ink-on-black).
   */
  accentSlab?: 'intrinsic' | 'parent';
  /**
   * `true` (default) — stretches to the parent width (forms, footers).
   * `false` — width follows label + padding (e.g. centered hero CTAs with a
   * wrapping accent slab).
   */
  fullWidth?: boolean;
  /** Light impact on press. Default `true`. */
  haptic?: boolean;
  /**
   * Accent only: taller tap target, full pill, larger bold sans label — for
   * sticky footers and primary submits (`labelCase="none"` recommended).
   */
  ctaProminence?: 'standard' | 'expressive';
  /** Optional icon or node (decorative). Hidden from screen readers; use `accessibilityLabel`. */
  leading?: ReactNode;
  /** Subtle idle “breath” on interactable primary CTAs (premium onboarding). */
  ambientBreathing?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'secondary',
  trailing = 'none',
  labelCase = 'none',
  accentSlab = 'intrinsic',
  fullWidth = true,
  contentAlign,
  haptic = true,
  ctaProminence = 'standard',
  leading,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
  ambientBreathing = false,
}: ButtonProps) {
  const palette = useThemeColors();
  const isPrimary = variant === 'primary';
  const isAccent = variant === 'accent';
  const accentFromParent = isAccent && accentSlab === 'parent';
  const isExpressiveAccent = isAccent && ctaProminence === 'expressive';
  const isInteractable = !disabled && !loading;
  const hasLeading = Boolean(leading) && !loading;

  const reduceMotion = useReducedMotion();
  const pressScale = useSharedValue(1);
  const breath = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(breath);
    if (reduceMotion || !ambientBreathing || !isInteractable) {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(0.987, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [ambientBreathing, breath, isInteractable, reduceMotion]);

  const pressScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * breath.value }],
  }));

  const handlePressIn = (): void => {
    if (!isInteractable || reduceMotion) return;
    pressScale.value = withSpring(scaleMotion.pressedLight.value, spring.stiff);
  };

  const handlePressOut = (): void => {
    pressScale.value = withSpring(1, spring.snappy);
  };
  const handlePress = () => {
    if (!isInteractable) return;
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // no-op: haptics is best-effort (older Android / Expo Go quirks)
      });
    }
    onPress?.();
  };

  // Resolve colours up-front, then drop them into the inline style array.
  // `border` (not `borderSubtle`) is the disabled frame — `borderSubtle` is
  // only one luminance step from the screen background in light mode and
  // reads as "no border at all".
  const borderColor = (() => {
    if (disabled) {
      return isAccent ? palette.borderStrong : palette.border;
    }
    if (accentFromParent) {
      return 'transparent';
    }
    if (isAccent) return palette.accent;
    return palette.textPrimary;
  })();

  const labelColor = (() => {
    if (disabled) return palette.textSecondary;
    if (isAccent) return palette.textOnAccent;
    if (isPrimary) return palette.background;
    return palette.textPrimary;
  })();

  const passthroughStyles = Array.isArray(style) ? style : style != null ? [style] : [];

  const resolvedContentAlign = contentAlign ?? (trailing === 'none' ? 'center' : 'between');

  const labelEl = (
    <Text
      style={[
        styles.label,
        labelCase === 'none' &&
          (isExpressiveAccent ? styles.labelExpressiveAccent : styles.labelSentenceCase),
        { color: labelColor },
        resolvedContentAlign === 'center' && !leading && styles.labelCentered,
        hasLeading && trailing === 'arrow' && resolvedContentAlign !== 'center'
          ? styles.labelInLeadingRow
          : null,
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );

  const arrowEl =
    trailing === 'arrow' ? (
      <Text
        style={[styles.arrow, { color: labelColor }]}
        numberOfLines={1}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        →
      </Text>
    ) : null;

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      android_ripple={null}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fillWidth : styles.hugWidth,
        isExpressiveAccent && styles.expressiveAccentBase,
        ...passthroughStyles,
        {
          borderColor,
          borderWidth: isExpressiveAccent && isInteractable && !accentFromParent ? 0 : 1,
          ...(isAccent ? { overflow: 'hidden' as const } : {}),
          ...(accentFromParent && !disabled ? { borderWidth: 0 } : {}),
          // Background resolution:
          //   accent   enabled  → `accent`; pressed → `accentPress`; disabled → `surfaceOverlay`
          //   accent + parent slab → transparent; pressed → `accentPress` (dims over parent lime)
          //   primary  enabled  → `textPrimary`; pressed → `textSecondary`; disabled → `surfaceElevated`
          //   secondary pressed → `surfaceElevated`; else transparent
          //
          // Surface colours are merged AFTER `style` so layout props (radius, margin, shadow host)
          // cannot override the fill — fixes light-mode accent CTAs going white-on-white when a
          // later style accidentally clobbers `backgroundColor`.
          backgroundColor: isAccent
            ? disabled
              ? palette.surfaceOverlay
              : pressed
                ? palette.accentPress
                : accentFromParent
                  ? 'transparent'
                  : palette.accent
            : isPrimary
              ? disabled
                ? palette.surfaceElevated
                : pressed
                  ? palette.textSecondary
                  : palette.textPrimary
              : pressed && !disabled
                ? palette.surfaceElevated
                : 'transparent',
        },
      ]}
    >
      <Animated.View
        style={[
          pressScaleStyle,
          {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: resolvedContentAlign === 'center' ? 'center' : 'space-between',
            minWidth: 0,
            width: '100%',
          },
        ]}
      >
        {loading ? (
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="small" color={labelColor} />
          </View>
        ) : hasLeading && trailing === 'arrow' && resolvedContentAlign === 'center' ? (
          <View style={styles.leadingArrowCenterCluster}>
            <View accessibilityElementsHidden importantForAccessibility="no">
              {leading}
            </View>
            {labelEl}
            {arrowEl}
          </View>
        ) : hasLeading && trailing === 'arrow' ? (
          <View style={[styles.rowPair, fullWidth ? styles.rowPairFill : null]}>
            <View style={styles.leadingLabelCluster}>
              <View accessibilityElementsHidden importantForAccessibility="no">
                {leading}
              </View>
              {labelEl}
            </View>
            {arrowEl}
          </View>
        ) : hasLeading && trailing === 'none' ? (
          <View
            style={[
              styles.leadingOnlyRow,
              fullWidth ? styles.rowPairFill : null,
              resolvedContentAlign === 'center' ? styles.leadingOnlyRowCentered : null,
            ]}
          >
            <View accessibilityElementsHidden importantForAccessibility="no">
              {leading}
            </View>
            {labelEl}
          </View>
        ) : resolvedContentAlign === 'center' && trailing === 'arrow' ? (
          <View style={styles.contentCluster}>
            {labelEl}
            {arrowEl}
          </View>
        ) : trailing === 'arrow' ? (
          <View style={[styles.rowPair, fullWidth ? styles.rowPairFill : null]}>
            {labelEl}
            {arrowEl}
          </View>
        ) : (
          labelEl
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Pressable is the flex row directly — no inner wrapper. Avoids the
  // chicken-and-egg of `width: 100%` on a child whose parent sizes to
  // content. `width: '100%'` is also explicit alongside `alignSelf:
  // 'stretch'` so the button can't visually collapse in any flex parent.
  base: {
    height: 56,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.gap,
    flexShrink: 0,
    minWidth: 0,
    // Pin opacity to 1 explicitly. Old bundles sometimes carried
    // `opacity: 0.45` on the disabled state and produced "invisible but
    // tappable" CTAs in light mode. Disabled state is now expressed via
    // colour alone — never opacity.
    opacity: 1,
  },
  expressiveAccentBase: {
    minHeight: 58,
    height: 58,
    borderRadius: radius.full,
    paddingHorizontal: space.gapMd,
  },
  fillWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  hugWidth: {
    alignSelf: 'center',
  },
  contentCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    maxWidth: '100%',
    flexShrink: 1,
  },
  /** Label + arrow in one horizontal band (avoids wrap/stack quirks on hug-width CTAs). */
  rowPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: space.gapLg,
  },
  rowPairFill: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  label: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  labelSentenceCase: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.md,
    letterSpacing: typography.letterSpacing.normal,
    textTransform: 'none',
  },
  /** Bold sans slab — accent + `ctaProminence="expressive"`. */
  labelExpressiveAccent: {
    fontFamily: typography.fontFamily.sans.bold,
    fontSize: typography.fontSize.lg,
    letterSpacing: typography.letterSpacing.tight,
    textTransform: 'none',
  },
  labelCentered: {
    textAlign: 'center',
    width: '100%',
  },
  leadingArrowCenterCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapSm,
  },
  labelInLeadingRow: {
    flex: 1,
    minWidth: 0,
  },
  leadingLabelCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    flex: 1,
    minWidth: 0,
  },
  leadingOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    width: '100%',
  },
  leadingOnlyRowCentered: {
    justifyContent: 'center',
  },
  arrow: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg,
  },
  spinnerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
