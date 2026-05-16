import * as Haptics from 'expo-haptics';
import type { ReactElement, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getCurrencyDisplaySymbol } from '@/features/expenses/utils/currencyDisplaySymbol';
import {
  sanitizeAmountTyping,
  splitAmountDisplayParts,
} from '@/features/expenses/utils/amountParsing';
import { duration, easing, space, typography, useThemeColors, useThemeMode } from '@/theme';

export type AmountHeroProps = {
  value: string;
  currency: string;
  onChange: (next: string) => void;
  inputRef?: RefObject<TextInput | null>;
  accessibilityHint?: string;
};

const AMOUNT_LINE_HEIGHT_RATIO = 1.02;
/** Currency glyph — sized to read as part of the same number block. */
const CURRENCY_SYMBOL_SIZE_KEY = '4xl' as const;

export function AmountHero({
  value,
  currency,
  onChange,
  inputRef,
  accessibilityHint,
}: AmountHeroProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const fallbackRef = useRef<TextInput>(null);
  const ref = inputRef ?? fallbackRef;
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sym = getCurrencyDisplaySymbol(currency);
  const trimmed = value.replace(/,/g, '').trim();
  const { integer, fraction } = splitAmountDisplayParts(value);
  const displayCore = trimmed === '' ? '' : `${integer}${fraction}`;

  const focusSv = useSharedValue(0);
  const underlinePulse = useSharedValue(1);
  const rowScale = useSharedValue(1);
  const typeNudgeY = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    focusSv.value = withTiming(focused ? 1 : 0, {
      duration: duration.fast.ms,
      easing: easing.standard.rn,
    });
  }, [focusSv, focused]);

  useEffect(() => {
    if (focused && !reduceMotion) {
      underlinePulse.value = withRepeat(
        withSequence(
          withTiming(0.62, {
            duration: 480,
            easing: easing.standard.rn,
          }),
          withTiming(1, {
            duration: 480,
            easing: easing.standard.rn,
          }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(underlinePulse);
      underlinePulse.value = 1;
    }
  }, [focused, reduceMotion, underlinePulse]);

  const underlineStyle = useAnimatedStyle(() => {
    const heightPx = focusSv.value * (2 - StyleSheet.hairlineWidth) + StyleSheet.hairlineWidth;
    const unfocusedOp = 0.7;
    const focusedOp = (0.78 + 0.22 * underlinePulse.value) * focusSv.value;
    const unfocusedPart = (1 - focusSv.value) * unfocusedOp;
    return {
      height: heightPx,
      opacity: focusedOp + unfocusedPart,
      backgroundColor: focusSv.value > 0.5 ? palette.accent : palette.border,
    };
  }, [palette.accent, palette.border]);

  const rowMotionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }, { translateY: typeNudgeY.value }],
  }));

  const bumpKeypadFeedback = useCallback(() => {
    if (reduceMotion) return;
    rowScale.value = withSequence(
      withTiming(1.022, {
        duration: duration.micro.ms,
        easing: easing.standard.rn,
      }),
      withTiming(1, {
        duration: duration.fast.ms,
        easing: easing.standard.rn,
      }),
    );
    typeNudgeY.value = withSequence(
      withTiming(-2, {
        duration: duration.micro.ms,
        easing: easing.standard.rn,
      }),
      withTiming(0, {
        duration: duration.fast.ms,
        easing: easing.standard.rn,
      }),
    );
  }, [reduceMotion, rowScale, typeNudgeY]);

  const bumpSelection = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    ref.current?.focus();
  }, [ref]);

  const amountSize = typography.fontSize.amountHero;
  const symbolSize = typography.fontSize[CURRENCY_SYMBOL_SIZE_KEY];
  const lineHeightAmount = Math.round(amountSize * AMOUNT_LINE_HEIGHT_RATIO);
  const lineHeightSymbol = Math.round(symbolSize * AMOUNT_LINE_HEIGHT_RATIO);

  return (
    <Pressable
      accessibilityRole="button"
      accessible={false}
      onPress={bumpSelection}
      style={{ alignSelf: 'stretch', paddingBottom: 0 }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: space.gapSm,
          },
          rowMotionStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: symbolSize,
            lineHeight: lineHeightSymbol,
            fontWeight: typography.fontWeight.medium,
            color: focused || trimmed !== '' ? palette.textPrimary : palette.textSecondary,
            letterSpacing: typography.letterSpacing.wide,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {sym}
        </Text>
        <TextInput
          ref={ref}
          value={displayCore}
          onChangeText={(raw) => {
            const next = sanitizeAmountTyping(raw);
            if (next !== value) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              bumpKeypadFeedback();
            }
            onChange(next);
          }}
          keyboardType="decimal-pad"
          keyboardAppearance={themeMode === 'dark' ? 'dark' : 'light'}
          cursorColor={palette.accent}
          selectionColor={palette.accent}
          accessibilityLabel={t('expenses.add.premium.amountA11y')}
          accessibilityHint={accessibilityHint}
          onFocus={() => {
            setFocused(true);
            void Haptics.selectionAsync().catch(() => {});
          }}
          onBlur={() => setFocused(false)}
          placeholder="0.00"
          placeholderTextColor={focused ? palette.textPrimary : palette.textSecondary}
          style={{
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 96,
            fontFamily: typography.fontFamily.mono.bold,
            fontSize: amountSize,
            lineHeight: lineHeightAmount,
            fontWeight: typography.fontWeight.bold,
            letterSpacing: typography.letterSpacing.tight,
            fontVariant: ['tabular-nums'],
            color: palette.textPrimary,
            paddingVertical: 0,
            paddingHorizontal: 0,
            marginVertical: 0,
            textAlign: 'left',
            includeFontPadding: false,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            marginTop: space.gapXs,
            borderRadius: StyleSheet.hairlineWidth,
            alignSelf: 'stretch',
          },
          underlineStyle,
        ]}
      />
    </Pressable>
  );
}
