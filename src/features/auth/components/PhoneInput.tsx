import { type ComponentRef, forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Input, type InputProps } from '@/components/ui';
import { space, typography, useThemeColors } from '@/theme';
import { stripPhoneInput } from '@/utils';

export type PhoneInputProps = Omit<
  InputProps,
  | 'keyboardType'
  | 'autoComplete'
  | 'textContentType'
  | 'leftAdornment'
  | 'rightAdornment'
  | 'inputMode'
  | 'label'
> & {
  /** Field label. Defaults to `Mobile number`. */
  label?: string;
  /** Country dial code shown as a left adornment, e.g. `+91`. */
  countryCode?: string;
  /** Maximum number of digits accepted (excludes the country code). */
  maxDigits?: number;
  /**
   * Show a tabular `NN/MM` digit counter on the right side of the field.
   * Off by default — opt in for high-touch screens (auth, OTP, etc.) where
   * the user benefits from seeing how close they are to the cap.
   */
  showDigitCounter?: boolean;
  /** Wrapped field container (border radius, padding context). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional flag shown before the dial code (e.g. regional UX). */
  countryFlagEmoji?: string;
};

/**
 * Phone-number input. Thin wrapper over the generic `Input` that:
 * - Adds a mono-typeset country code prefix on the left.
 * - Strips non-numeric characters as the user types.
 * - Locks the keyboard, autocomplete, and content type to telephone semantics.
 *
 * Defaults to the Indian dial code with a 10-digit limit; override either
 * via props for other markets. Theme-aware via `useThemeColors()`.
 */
export const PhoneInput = forwardRef<ComponentRef<typeof Input>, PhoneInputProps>(
  function PhoneInput(
    {
      label = 'Mobile number',
      countryCode = '+91',
      countryFlagEmoji,
      maxDigits = 10,
      showDigitCounter = false,
      value,
      onChangeText,
      containerStyle,
      fieldVariant = 'outline',
      ...rest
    },
    ref,
  ) {
    const palette = useThemeColors();

    const handleChange = useCallback(
      (next: string) => {
        let digitsOnly = stripPhoneInput(next);
        // Paste edge case: full Indian MSISDN `919876543210` — taking the first
        // 10 digits would wrongly yield `9198765432`. Strip trunk `91` once.
        if (countryCode === '+91' && digitsOnly.length > maxDigits && digitsOnly.startsWith('91')) {
          digitsOnly = digitsOnly.slice(2);
        }
        digitsOnly = digitsOnly.slice(0, maxDigits);
        onChangeText?.(digitsOnly);
      },
      [countryCode, maxDigits, onChangeText],
    );

    const counterValue = String(value?.length ?? 0).padStart(2, '0');
    const maxValue = String(maxDigits).padStart(2, '0');
    const counterColor = (value?.length ?? 0) === maxDigits ? palette.accent : palette.textMuted;

    return (
      <Input
        ref={ref}
        label={label}
        fieldVariant={fieldVariant}
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={maxDigits}
        containerStyle={containerStyle}
        leftAdornment={
          <View style={styles.prefixWrap}>
            {countryFlagEmoji ? (
              <Text style={styles.flag} accessible={false}>
                {countryFlagEmoji}
              </Text>
            ) : null}
            <Text style={[styles.prefix, { color: palette.textSecondary }]}>{countryCode}</Text>
            <View style={[styles.divider, { backgroundColor: palette.borderSubtle }]} />
          </View>
        }
        rightAdornment={
          showDigitCounter ? (
            <Text style={[styles.counter, { color: counterColor }]}>
              {counterValue}/{maxValue}
            </Text>
          ) : undefined
        }
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
  },
  flag: {
    fontSize: 22,
    lineHeight: 26,
  },
  prefix: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.base,
  },
  divider: {
    width: 1,
    height: 18,
  },
  counter: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    fontVariant: ['tabular-nums'],
  },
});
