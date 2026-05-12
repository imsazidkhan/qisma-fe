import type { ReactElement, RefObject } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { duration, easing, space, typography, useThemeColors } from '@/theme';

export type InlineEditableTitleProps = {
  value: string;
  onChange: (next: string) => void;
  placeholderKey: string;
  inputRef?: RefObject<TextInput | null>;
};

/** Flat title field — no container, accent underline appears on focus only. */
export function InlineEditableTitle({
  value,
  onChange,
  placeholderKey,
  inputRef,
}: InlineEditableTitleProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const fallbackRef = useRef<TextInput>(null);
  const ref = inputRef ?? fallbackRef;
  const focusSv = useSharedValue(0);

  const underlineStyle = useAnimatedStyle(
    () => ({
      opacity: focusSv.value,
      backgroundColor: palette.accent,
    }),
    [palette.accent],
  );

  return (
    <View style={{ alignSelf: 'stretch' }}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        placeholder={t(placeholderKey)}
        placeholderTextColor={palette.textMuted}
        selectionColor={palette.accent}
        cursorColor={palette.accent}
        accessibilityLabel={t('expenses.add.premium.titleInputA11y')}
        multiline
        scrollEnabled={false}
        underlineColorAndroid="transparent"
        onFocus={() => {
          focusSv.value = withTiming(1, { duration: duration.fast.ms, easing: easing.standard.rn });
        }}
        onBlur={() => {
          focusSv.value = withTiming(0, { duration: duration.fast.ms, easing: easing.standard.rn });
        }}
        style={{
          fontFamily: typography.fontFamily.sans.semiBold,
          fontSize: typography.fontSize['2xl'],
          lineHeight: typography.fontSize['2xl'] * 1.25,
          letterSpacing: typography.letterSpacing.tight,
          color: palette.textPrimary,
          paddingVertical: space.gapSm,
          paddingHorizontal: 0,
          margin: 0,
          includeFontPadding: false,
        }}
      />
      <Animated.View
        style={[{ height: 1, alignSelf: 'stretch', borderRadius: 1 }, underlineStyle]}
      />
    </View>
  );
}
