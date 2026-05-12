import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import { OTP } from '@/constants';
import { radius, space, typography, useThemeColors } from '@/theme';

export type OtpCodeFieldProps = {
  value: string;
  onChangeText: (digits: string) => void;
  editable?: boolean;
  /** Highlights cells + optional focus ring when the last verify failed. */
  hasError?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
};

/**
 * Six mono digit cells with a transparent input overlay — Nothing-style OTP
 * entry. Keeps one real `TextInput` for SMS autofill and predictable focus.
 */
export const OtpCodeField = forwardRef<TextInputType, OtpCodeFieldProps>(function OtpCodeField(
  { value, onChangeText, editable = true, hasError = false, accessibilityHint, accessibilityLabel },
  ref,
) {
  const palette = useThemeColors();
  const inputRef = useRef<TextInputType>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => inputRef.current as TextInputType);

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, OTP.CODE_LENGTH);
      onChangeText(digits);
    },
    [onChangeText],
  );

  const activeSlot = focused ? Math.min(value.length, OTP.CODE_LENGTH - 1) : -1;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cellsRow} pointerEvents="none">
        {Array.from({ length: OTP.CODE_LENGTH }, (_, i) => {
          const ch = value[i];
          const isActive = focused && i === activeSlot;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  borderColor: hasError
                    ? palette.error
                    : isActive
                      ? palette.borderFocus
                      : palette.border,
                  backgroundColor: palette.surfaceBase,
                },
              ]}
            >
              <Text
                style={[styles.cellDigit, { color: ch ? palette.textPrimary : palette.textMuted }]}
              >
                {ch ?? '—'}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={editable}
        keyboardType="number-pad"
        maxLength={OTP.CODE_LENGTH}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill="yes"
        autoFocus
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[styles.hiddenInput, Platform.OS === 'android' ? styles.hiddenInputAndroid : null]}
      />
    </View>
  );
});

const CELL_ASPECT = 52;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    minHeight: CELL_ASPECT + 2,
    width: '100%',
  },
  cellsRow: {
    flexDirection: 'row',
    gap: space.gapSm,
    height: CELL_ASPECT,
  },
  cell: {
    flex: 1,
    minWidth: 36,
    height: CELL_ASPECT,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDigit: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xl'],
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    opacity: 0,
    color: 'transparent',
  },
  hiddenInputAndroid: {
    opacity: 0.02,
  },
});
