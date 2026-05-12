import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import type { ReactElement, RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingCTA } from '@/features/expenses/components/addExpense/FloatingCTA';
import { radius, size, space, typography, useThemeColors } from '@/theme';

const QUICK_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD'] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function ymdFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export type MetaPickSheetProps = {
  sheetRef: RefObject<BottomSheetModal | null>;
  dateYmd: string;
  onDateChange: (ymd: string) => void;
  currency: string;
  onCurrencyChange: (code: string) => void;
  onSave: () => void;
};

export function MetaPickSheet({
  sheetRef,
  dateYmd,
  onDateChange,
  currency,
  onCurrencyChange,
  onSave,
}: MetaPickSheetProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['42%', '58%'], []);

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.42} />
    );
  }, []);

  const today = ymdFromDate(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = ymdFromDate(y);

  const labelFor = (ymd: string) => {
    if (ymd === today) return t('expenses.add.modern.todayLabel');
    if (ymd === yesterday) return t('expenses.add.modern.yesterdayLabel');
    return ymd;
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: palette.borderStrong,
        width: size.bottomSheetHandle * 10,
        height: size.bottomSheetHandle,
      }}
      backgroundStyle={{
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        backgroundColor: palette.sheetBackground,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.sectionGapLg + space.gapXl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.sans.semiBold,
            fontSize: typography.fontSize.lg,
            color: palette.textPrimary,
            marginBottom: space.gapMd,
          }}
        >
          {t('expenses.add.modern.dateCurrencyTitle')}
        </Text>

        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize['2xs'],
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            marginBottom: space.gapSm,
          }}
        >
          {t('expenses.add.premium.sheetDateTitle')}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: space.gapSm,
            marginBottom: space.gapLg,
          }}
        >
          {[today, yesterday].map((ymd) => {
            const sel = dateYmd === ymd;
            return (
              <Pressable
                key={ymd}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  onDateChange(ymd);
                }}
                style={{
                  paddingVertical: space.gapSm,
                  paddingHorizontal: space.gapMd,
                  borderRadius: radius.full,
                  backgroundColor: sel ? palette.accentSoft : palette.surfaceFloating,
                  borderWidth: 1,
                  borderColor: sel ? palette.accent : palette.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.medium,
                    fontSize: typography.fontSize.xs,
                    color: palette.textPrimary,
                  }}
                >
                  {labelFor(ymd)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={{
            fontFamily: typography.fontFamily.mono.regular,
            fontSize: typography.fontSize.xs,
            color: palette.textMuted,
            marginBottom: space.gapXs,
          }}
        >
          YYYY-MM-DD
        </Text>
        <TextInput
          value={dateYmd}
          onChangeText={onDateChange}
          placeholder="2026-05-10"
          placeholderTextColor={palette.textMuted}
          keyboardType="numbers-and-punctuation"
          style={{
            borderRadius: radius.lg,
            paddingHorizontal: space.gapMd,
            paddingVertical: space.gap,
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize.md,
            color: palette.textPrimary,
            backgroundColor: palette.surfaceBase,
            marginBottom: space.gapLg,
          }}
        />

        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize['2xs'],
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            marginBottom: space.gapSm,
          }}
        >
          {t('expenses.add.premium.sheetCurrencyTitle')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
          {QUICK_CURRENCIES.map((code) => {
            const sel = currency.trim().toUpperCase() === code;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  onCurrencyChange(code);
                }}
                style={{
                  paddingVertical: space.gapSm,
                  paddingHorizontal: space.gapMd,
                  borderRadius: radius.full,
                  backgroundColor: sel ? palette.accentSoft : palette.surfaceFloating,
                  borderWidth: 1,
                  borderColor: sel ? palette.accent : palette.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.medium,
                    fontSize: typography.fontSize.xs,
                    color: palette.textPrimary,
                  }}
                >
                  {code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheetScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: space.gapLg + insets.bottom,
          paddingHorizontal: space.screenPadding,
        }}
      >
        <FloatingCTA
          label={t('expenses.add.modern.dateCurrencySave')}
          accessibilityLabel={t('expenses.add.modern.dateCurrencySave')}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            onSave();
          }}
        />
      </View>
    </BottomSheetModal>
  );
}
