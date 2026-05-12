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
 * - Resting label = sans body, `textMuted`.
 * - Active label  = mono UPPERCASE 2xs, `textSecondary` — Nothing-OS metadata feel.
 * - Outlined, hairline border that animates `border` → `borderFocus` (accent) on focus,
 *   or `error` when an error message is present. No shadows, no underline, no bounce.
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

  // Border color reads from the active palette and re-evaluates whenever the
  // palette swaps (i.e. on light/dark toggle).
  const borderResting = fieldVariant === 'ghost' ? 'transparent' : palette.border;
  const borderActive = fieldVariant === 'ghost' ? 'transparent' : palette.borderFocus;
  const borderError = palette.error;
  const fieldStyle = useAnimatedStyle(() => {
    if (error) {
      return { borderColor: borderError };
    }
    return {
      borderColor: interpolateColor(focusProgress.value, [0, 1], [borderResting, borderActive]),
    };
  }, [error, borderResting, borderActive, borderError]);

  return (
    <View style={containerStyle}>
      <View style={styles.activeLabelSlot} pointerEvents="none">
        <Animated.Text
          style={[styles.activeLabel, { color: palette.textSecondary }, activeLabelStyle]}
        >
          {label}
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.field,
          fieldVariant === 'ghost' && styles.fieldGhost,
          fieldStyle,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftAdornment ? <View style={styles.leftAdornment}>{leftAdornment}</View> : null}

        <View style={styles.inputWrap}>
          <Animated.Text
            style={[styles.restingLabel, { color: palette.textMuted }, restingLabelStyle]}
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
            placeholderTextColor={palette.placeholder}
            cursorColor={palette.cursor}
            selectionColor={palette.selection}
            style={[styles.input, { color: palette.textPrimary }, textInputStyle]}
            {...rest}
          />
        </View>

        {rightAdornment ? <View style={styles.rightAdornment}>{rightAdornment}</View> : null}
      </Animated.View>

      {error || helperText ? (
        <Text
          style={[styles.helper, { color: error ? palette.errorText : palette.textMuted }]}
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.input,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: space.inputPadH,
    backgroundColor: 'transparent',
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
    paddingVertical: space.inputPadV,
    paddingHorizontal: 0,
    margin: 0,
  },
  helper: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
    marginTop: space.gapXs,
  },
});
