import { type ComponentRef, forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Input, type InputProps } from '@/components/ui';
import { radius, space, typography, useThemeColors } from '@/theme';
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
  | 'fieldBorderRadius'
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
  /**
   * Optional flag before the dial code. Omit for default 🇮🇳 when `countryCode` is `+91`.
   * Pass `null` to hide the flag.
   */
  countryFlagEmoji?: string | null;
  /** Softer filled surface + premium shell (login / onboarding). */
  heroSurface?: boolean;
  /** Insert a space after the first five digits (10-digit IN display). */
  formatDigitGroups?: boolean;
  /**
   * Outlined dial-code chip + divider (Nothing-style) without the full {@link heroSurface}
   * treatment. For premium forms inside an outer shell (e.g. group invites).
   */
  prefixChip?: boolean;
  /** Tabular mono digits — calmer hierarchy next to suggested contacts. */
  monoDigits?: boolean;
};

/**
 * Same chrome as the login phone step (`LoginFormCard`). Spread into `PhoneInput` for consistent
 * hero field, digit counter, and +91 grouping elsewhere (e.g. group invites).
 */
export const phoneInputLoginPreset: Pick<
  PhoneInputProps,
  'showDigitCounter' | 'heroSurface' | 'formatDigitGroups'
> = {
  showDigitCounter: true,
  heroSurface: true,
  formatDigitGroups: true,
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
      heroSurface = false,
      formatDigitGroups = false,
      prefixChip = false,
      monoDigits = false,
      style: inputTextStyle,
      ...rest
    },
    ref,
  ) {
    const palette = useThemeColors();
    const showPrefixChip = prefixChip && !heroSurface;

    const resolvedFlag = useMemo(() => {
      if (countryFlagEmoji === null) return null;
      if (countryFlagEmoji !== undefined) return countryFlagEmoji;
      return countryCode === '+91' ? '🇮🇳' : null;
    }, [countryCode, countryFlagEmoji]);

    const handleChange = useCallback(
      (next: string) => {
        let digitsOnly = stripPhoneInput(next);
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
    const counterFull = (value?.length ?? 0) === maxDigits;

    const displayValue = useMemo(() => {
      const raw = value ?? '';
      if (!formatDigitGroups || raw.length <= 5) return raw;
      return `${raw.slice(0, 5)} ${raw.slice(5)}`;
    }, [formatDigitGroups, value]);

    const chipShell = {
      backgroundColor: palette.inputBackground,
      borderColor: palette.inputBackground,
    };
    const inkHairline = { backgroundColor: palette.textPrimary, opacity: 0.1 };

    const leftAdornment = heroSurface ? (
      <View style={styles.prefixRowHero}>
        <View style={[styles.prefixChip, chipShell]}>
          {resolvedFlag ? (
            <Text style={styles.flag} accessible={false}>
              {resolvedFlag}
            </Text>
          ) : null}
          <Text style={[styles.prefixCodeHero, { color: palette.textPrimary }]}>{countryCode}</Text>
        </View>
        <View style={[styles.dividerHero, inkHairline]} />
      </View>
    ) : showPrefixChip ? (
      <View style={styles.prefixRowChip}>
        <View style={[styles.prefixChipCompact, chipShell]}>
          {resolvedFlag ? (
            <Text style={styles.flagCompact} accessible={false}>
              {resolvedFlag}
            </Text>
          ) : null}
          <Text style={[styles.prefixCodeChip, { color: palette.textPrimary }]}>{countryCode}</Text>
        </View>
        <View style={[styles.dividerChip, inkHairline]} />
      </View>
    ) : (
      <View style={styles.prefixWrap}>
        {resolvedFlag ? (
          <Text style={styles.flag} accessible={false}>
            {resolvedFlag}
          </Text>
        ) : null}
        <Text style={[styles.prefix, { color: palette.textPrimary, opacity: 0.52 }]}>{countryCode}</Text>
        <View style={[styles.divider, inkHairline]} />
      </View>
    );

    return (
      <Input
        ref={ref}
        label={label}
        fieldVariant={fieldVariant}
        surfaceTone={heroSurface ? 'filled' : 'transparent'}
        focusBorderMode={heroSurface ? 'neutral' : 'accent'}
        focusElevation={false}
        fieldBorderRadius={heroSurface ? radius['2xl'] : radius.input}
        value={displayValue}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={formatDigitGroups ? undefined : maxDigits}
        containerStyle={containerStyle}
        leftAdornment={leftAdornment}
        rightAdornment={
          showDigitCounter ? (
            <Text
              style={[
                styles.counter,
                counterFull
                  ? { color: palette.accent }
                  : { color: palette.textPrimary, opacity: 0.42 },
              ]}
            >
              {counterValue}/{maxValue}
            </Text>
          ) : undefined
        }
        style={[
          heroSurface || monoDigits
            ? {
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize.lg,
                letterSpacing: typography.letterSpacing.wide,
                fontVariant: ['tabular-nums'],
              }
            : null,
          inputTextStyle,
        ]}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  prefixRowHero: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.gapMd,
  },
  prefixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prefixCodeHero: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.wide,
    fontVariant: ['tabular-nums'],
  },
  dividerHero: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: space.gapXs,
    minHeight: 26,
  },
  prefixRowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
  },
  prefixChipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapXs,
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapSm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  prefixCodeChip: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.wide,
    fontVariant: ['tabular-nums'],
  },
  dividerChip: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    alignSelf: 'center',
  },
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
    width: StyleSheet.hairlineWidth,
    height: 20,
  },
  counter: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    fontVariant: ['tabular-nums'],
  },
});
