import { forwardRef, type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  duration,
  easing,
  radius,
  size,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

/**
 * Generic, theme-driven text input.
 *
 * - Label sits inside on rest, calmly floats above the field on focus / fill.
 * - Resting label = sans body, `textPrimary` (no muted grey slab).
 * - Active label  = mono UPPERCASE 2xs, `textPrimary` — stays on monochrome rail.
 * - Outlined border: 1px at rest with color matching fill (no grey edge); color
 *   animates on focus. (`borderWidth` is never 0 — some platforms drop touches.)
 *   `borderStrong` (`focusBorderMode="neutral"`) on focus, or `error` when an
 *   error message is present. Optional `focusElevation` adds a soft shadow on focus.
 * - Theme-aware: subscribes to `useThemeColors()`, so light / dark switches live.
 *
 * Accepts every `TextInputProps` field; consumers should NOT pass `placeholder`
 * (use `label` instead — they serve the same purpose here).
 */
export type InputProps = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  error?: string;
  helperText?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  /** `ghost` — no field border; use inside a parent “card” surface. */
  fieldVariant?: 'outline' | 'ghost';
  /** Field height — `filled` is more comfortable. Shell fill is `inputBackground` (white in light). */
  surfaceTone?: 'transparent' | 'filled';
  /** `accent` (default) animates toward `borderFocus`; `neutral` toward `borderStrong` (monochrome). */
  focusBorderMode?: 'accent' | 'neutral';
  /**
   * When `surfaceTone="filled"` and `focusElevation` is true, a soft shadow
   * ramps in on focus (calm; respects reduced motion via RN — shadow only).
   */
  focusElevation?: boolean;
  /**
   * Corner radius of the field shell (defaults to {@link radius.input}).
   * Use a larger value for premium “hero” phone fields on auth surfaces.
   */
  fieldBorderRadius?: number;
  /** Style applied to the outer wrapper `View`. The `style` prop is forwarded
   *  to the inner `TextInput` (TextStyle) — RN's typing means the two can't
   *  be the same prop. */
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    value,
    error,
    helperText,
    leftAdornment,
    rightAdornment,
    onFocus,
    onBlur,
    containerStyle,
    style: textInputStyle,
    editable = true,
    fieldVariant = 'outline',
    surfaceTone = 'transparent',
    focusBorderMode = 'accent',
    focusElevation = false,
    fieldBorderRadius = radius.input,
    ...rest
  },
  ref,
) {
  const palette = useThemeColors();
  const [focused, setFocused] = useState(false);
  const hasValue = (value ?? '').length > 0;
  const isActive = focused || hasValue;

  const labelProgress = useSharedValue(isActive ? 1 : 0);
  const focusProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    labelProgress.value = withTiming(isActive ? 1 : 0, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
  }, [isActive, labelProgress]);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: duration.fast.ms,
      easing: easing.standard.rn,
    });
  }, [focused, focusProgress]);

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const restingLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - labelProgress.value,
  }));

  const activeLabelStyle = useAnimatedStyle(() => ({
    opacity: labelProgress.value,
    transform: [{ translateY: (1 - labelProgress.value) * 4 }],
  }));

  const fieldFill = fieldVariant === 'ghost' ? 'transparent' : palette.inputBackground;
  const borderRestingOpaque =
    fieldVariant === 'ghost' ? 'rgba(0,0,0,0)' : palette.inputBackground;
  const borderActiveColor =
    fieldVariant === 'ghost'
      ? 'rgba(0,0,0,0)'
      : focusBorderMode === 'neutral'
        ? palette.borderStrong
        : palette.borderFocus;
  const borderError = palette.error;
  const fieldStyle = useAnimatedStyle(() => {
    if (error) {
      return { borderColor: borderError, borderWidth: 1 };
    }
    if (fieldVariant === 'ghost') {
      return { borderColor: 'rgba(0,0,0,0)', borderWidth: 0 };
    }

    return {
      borderWidth: 1,
      borderColor: interpolateColor(
        focusProgress.value,
        [0, 1],
        [borderRestingOpaque, borderActiveColor],
      ),
    };
  }, [error, borderError, fieldVariant, borderRestingOpaque, borderActiveColor]);

  const fieldShadowStyle = useAnimatedStyle(() => {
    if (!focusElevation || fieldVariant === 'ghost') {
      return { shadowOpacity: 0, elevation: 0 };
    }
    const p = focusProgress.value;
    return {
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 2 + p * 3 },
      shadowOpacity: 0.04 + p * 0.12,
      shadowRadius: 4 + p * 6,
      elevation: Math.round(p * 3),
    };
  }, [focusElevation, fieldVariant, palette.shadow]);

  return (
    <View style={containerStyle}>
      <View style={styles.activeLabelSlot} pointerEvents="none">
        <Animated.Text
          style={[styles.activeLabel, { color: palette.textPrimary }, activeLabelStyle]}
        >
          {label}
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.fieldShadowHost,
          { borderRadius: fieldBorderRadius },
          fieldVariant !== 'ghost' && surfaceTone === 'filled' && styles.fieldShadowHostFilled,
          fieldShadowStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.field,
            { borderRadius: fieldBorderRadius },
            surfaceTone === 'filled' && styles.fieldComfortable,
            fieldVariant === 'ghost' && styles.fieldGhost,
            { backgroundColor: fieldFill },
            fieldStyle,
            !editable && styles.fieldDisabled,
          ]}
        >
          {leftAdornment ? <View style={styles.leftAdornment}>{leftAdornment}</View> : null}

          <View style={styles.inputWrap}>
            <Animated.Text
              style={[styles.restingLabel, { color: palette.textPrimary }, restingLabelStyle]}
              numberOfLines={1}
              pointerEvents="none"
            >
              {label}
            </Animated.Text>

            <TextInput
              ref={ref}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={editable}
              placeholderTextColor={palette.textPrimary}
              cursorColor={palette.cursor}
              selectionColor={palette.selection}
              underlineColorAndroid="transparent"
              style={[styles.input, { color: palette.textPrimary }, textInputStyle]}
              {...rest}
            />
          </View>

          {rightAdornment ? <View style={styles.rightAdornment}>{rightAdornment}</View> : null}
        </Animated.View>
      </Animated.View>

      {error || helperText ? (
        <Text
          style={[
            styles.helper,
            error
              ? { color: palette.errorText }
              : { color: palette.textPrimary, opacity: 0.45 },
          ]}
          numberOfLines={2}
        >
          {error ?? helperText}
        </Text>
      ) : null}
    </View>
  );
});

const ACTIVE_LABEL_HEIGHT = 18;

// Layout-only styles (no palette references). Palette-dependent properties
// are layered on as inline overrides above so they re-evaluate on theme swap.
const styles = StyleSheet.create({
  activeLabelSlot: {
    height: ACTIVE_LABEL_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: space.gapXs,
  },
  activeLabel: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  fieldShadowHost: {
    backgroundColor: 'transparent',
  },
  /** Match field radius so shadow clips cleanly on iOS. */
  fieldShadowHostFilled: {
    overflow: 'visible',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.input,
    borderWidth: 0,
    paddingHorizontal: space.inputPadH,
    backgroundColor: 'transparent',
  },
  fieldComfortable: {
    minHeight: size.inputLg,
    paddingVertical: space.gapXs,
  },
  fieldGhost: {
    borderWidth: 0,
    paddingHorizontal: space.gapSm,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  leftAdornment: {
    paddingRight: space.inputGap,
  },
  rightAdornment: {
    paddingLeft: space.inputGap,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  restingLabel: {
    ...textStyles.body,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  input: {
    ...textStyles.body,
    alignSelf: 'stretch',
    width: '100%',
    paddingVertical: space.inputPadV,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  helper: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
    marginTop: space.gapXs,
  },
});
