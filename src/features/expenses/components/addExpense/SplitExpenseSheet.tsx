import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { ReactElement, RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { SplitSheetParticipantRow } from '@/features/expenses/components/addExpense/SplitSheetParticipantRow';
import {
  splitTypeToSheetIndex,
  SplitTabBar,
} from '@/features/expenses/components/addExpense/SplitTabBar';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import {
  minorToMajorString,
  parseAmountToMinor,
  sanitizeAmountTyping,
} from '@/features/expenses/utils/amountParsing';
import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import {
  computeLocalSplitValidation,
  getSplitValidationMessageKey,
} from '@/features/expenses/utils/localExpenseSplit';
import {
  computeAfterSplitResult,
  computeCurrentUserShareMinor,
  computeMemberAmountMinorForPreview,
  formatPctOfTotal,
} from '@/features/expenses/utils/splitExpenseSheetBalances';
import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type SplitExpenseSheetProps = {
  sheetRef: RefObject<BottomSheetModal | null>;
  splitType: ExpenseSplitType;
  onChangeSplitType: (t: ExpenseSplitType) => void;
  includedMembers: GroupMemberRosterEntry[];
  totalAmountMajor: string;
  currency: string;
  currentUserId: string | undefined;
  paidByUserId: string;
  exactByUserId: Readonly<Record<string, string>>;
  setExactByUserId: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  percentByUserId: Readonly<Record<string, string>>;
  setPercentByUserId: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  sharesByUserId: Readonly<Record<string, number>>;
  setSharesByUserId: (updater: (prev: Record<string, number>) => Record<string, number>) => void;
  onSave: () => void;
};

function formatPctTotal(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function SplitExpenseSheet({
  sheetRef,
  splitType,
  onChangeSplitType,
  includedMembers,
  totalAmountMajor,
  currency,
  currentUserId,
  paidByUserId,
  exactByUserId,
  setExactByUserId,
  percentByUserId,
  setPercentByUserId,
  sharesByUserId,
  setSharesByUserId,
  onSave,
}: SplitExpenseSheetProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['56%'], []);

  const totalSanitized = totalAmountMajor.trim().replace(/,/g, '');
  const includedIds = useMemo(() => includedMembers.map((m) => m.id), [includedMembers]);

  const localSplitBase = useMemo(
    () => ({
      participantUserIds: includedIds,
      totalAmountMajor: totalSanitized,
      currency,
      exactByUserId,
      percentByUserId,
      sharesByUserId,
      adjustFixedByUserId: {} as Readonly<Record<string, string>>,
      adjustRemainderUserId: null as string | null | undefined,
    }),
    [currency, exactByUserId, includedIds, percentByUserId, sharesByUserId, totalSanitized],
  );

  const activeSplitValidation = useMemo(
    () =>
      computeLocalSplitValidation({
        ...localSplitBase,
        splitType,
      }),
    [localSplitBase, splitType],
  );

  const payerInSplit = Boolean(paidByUserId.trim()) && includedIds.includes(paidByUserId);

  const splitValidationMessageKey = useMemo(() => {
    const base = getSplitValidationMessageKey(activeSplitValidation);
    if (base !== '') return base;
    if (activeSplitValidation.kind === 'perfect' && !payerInSplit) {
      return 'expenses.add.validation.payerMustBeOnSplit';
    }
    return '';
  }, [activeSplitValidation, payerInSplit]);

  const splitConfirmEnabled = activeSplitValidation.kind === 'perfect' && payerInSplit;

  const tabLabels = useMemo(
    () => [
      t('expenses.add.modern.tabEqual'),
      t('expenses.add.modern.tabExact'),
      t('expenses.add.modern.tabPercent'),
      t('expenses.add.modern.tabShare'),
    ],
    [t],
  );

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.42} />
    );
  }, []);

  const equalPartsMajor = useMemo(
    () => computeEqualMajorPerPerson(totalSanitized, includedMembers.length),
    [includedMembers.length, totalSanitized],
  );

  const totalMinor = useMemo(() => parseAmountToMinor(totalSanitized), [totalSanitized]);

  const memberLabel = (m: GroupMemberRosterEntry) =>
    m.id === currentUserId
      ? t('expenses.add.premium.splitParticipantYou')
      : (m.name ?? m.username ?? m.id.slice(0, 6));

  const rowMeta = useCallback(
    (m: GroupMemberRosterEntry): string | null => {
      if (m.id !== paidByUserId) return null;
      if (m.id === currentUserId) return t('expenses.add.modern.splitSheetRowPaidByYou');
      return t('expenses.add.modern.splitSheetRowPayer');
    },
    [currentUserId, paidByUserId, t],
  );

  const sheetIdx = splitTypeToSheetIndex(splitType);

  const totalFormatted = useMemo(() => {
    const raw = totalSanitized;
    if (!raw || !Number.isFinite(Number(raw))) {
      return null;
    }
    return formatExpenseMajorAmount(raw, currency);
  }, [currency, totalSanitized]);

  const summaryPrimary = useMemo(() => {
    switch (sheetIdx) {
      case 0:
        return t('expenses.add.modern.splitSheetSummaryEqualTitle');
      case 1:
        return t('expenses.add.modern.splitSheetSummaryExactTitle');
      case 2:
        return t('expenses.add.modern.splitSheetSummaryPercentTitle');
      default:
        return t('expenses.add.modern.splitSheetSummaryShareTitle');
    }
  }, [sheetIdx, t]);

  const summarySecondary = useMemo(() => {
    if (includedMembers.length === 0) {
      return t('expenses.add.modern.splitSheetSummaryNeedPeople');
    }
    if (sheetIdx === 0) {
      const first = equalPartsMajor?.[0];
      if (!first || !totalFormatted) {
        return t('expenses.add.modern.splitSheetSummaryEnterTotal');
      }
      const each = formatExpenseMajorAmount(first.replace(/,/g, ''), currency);
      return t('expenses.add.modern.splitSheetSummaryPeopleEach', {
        count: includedMembers.length,
        amount: each,
      });
    }
    if (sheetIdx === 1) return t('expenses.add.modern.splitSheetSummaryExactHint');
    if (sheetIdx === 2) return t('expenses.add.modern.splitSheetSummaryPercentHint');
    return t('expenses.add.modern.splitSheetSummaryShareHint');
  }, [currency, equalPartsMajor, includedMembers.length, sheetIdx, t, totalFormatted]);

  const percentTotal = useMemo(() => {
    let s = 0;
    for (const m of includedMembers) {
      const raw = (percentByUserId[m.id] ?? '').replace(/,/g, '').trim();
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isFinite(n)) {
        s += n;
      }
    }
    return s;
  }, [includedMembers, percentByUserId]);

  const userShareMinor = useMemo(
    () =>
      computeCurrentUserShareMinor(
        splitType,
        includedIds,
        currentUserId,
        totalSanitized,
        exactByUserId,
        percentByUserId,
        sharesByUserId,
      ),
    [
      currentUserId,
      exactByUserId,
      includedIds,
      percentByUserId,
      sharesByUserId,
      splitType,
      totalSanitized,
    ],
  );

  const afterSplit = useMemo(
    () =>
      computeAfterSplitResult(totalMinor, userShareMinor, currentUserId, paidByUserId, includedIds),
    [currentUserId, includedIds, paidByUserId, totalMinor, userShareMinor],
  );

  const afterSplitCopy = useMemo(() => {
    if (!splitConfirmEnabled) return null;
    if (afterSplit.kind === 'hidden') return null;
    if (afterSplit.kind === 'even') {
      return t('expenses.add.modern.splitSheetAfterEven');
    }
    const amt = formatExpenseMajorAmount(minorToMajorString(afterSplit.minor), currency);
    if (afterSplit.kind === 'getBack') {
      return t('expenses.add.modern.splitSheetAfterGetBack', { amount: amt });
    }
    return t('expenses.add.modern.splitSheetAfterOwe', { amount: amt });
  }, [afterSplit, currency, splitConfirmEnabled, t]);

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  const inputAmountStyle = useMemo(
    () => ({
      minWidth: 96,
      paddingVertical: space.gapXs,
      paddingHorizontal: space.gapXs,
      fontFamily: typography.fontFamily.mono.medium,
      fontSize: typography.fontSize.lg,
      color: palette.textPrimary,
      textAlign: 'right' as const,
    }),
    [palette.textPrimary],
  );

  const percentLineForMember = (
    m: GroupMemberRosterEntry,
    _memberIndex: number,
    amountMinor: number | null,
  ): string | null => {
    if (sheetIdx === 2) {
      return null;
    }
    if (totalMinor === null || amountMinor === null) return null;
    return formatPctOfTotal(amountMinor, totalMinor);
  };

  let body: ReactElement;
  if (includedMembers.length === 0) {
    body = (
      <Text
        style={{
          marginTop: space.gap,
          fontFamily: typography.fontFamily.mono.regular,
          fontSize: typography.fontSize.sm,
          color: palette.textMuted,
          letterSpacing: typography.letterSpacing.wide,
          textTransform: 'uppercase',
        }}
      >
        {t('expenses.add.modern.splitSheetSummaryNeedPeople')}
      </Text>
    );
  } else if (sheetIdx === 0) {
    body = equalPartsMajor ? (
      <View
        style={{
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          overflow: 'hidden',
        }}
      >
        {includedMembers.map((m, i) => {
          const major = equalPartsMajor[i] ?? '0';
          const amtMinor = computeMemberAmountMinorForPreview(
            splitType,
            m.id,
            i,
            includedIds,
            totalSanitized,
            equalPartsMajor,
            exactByUserId,
            percentByUserId,
            sharesByUserId,
          );
          return (
            <SplitSheetParticipantRow
              key={m.id}
              avatarLetter={memberLabel(m)}
              avatarUrl={m.avatar}
              titleUpper={memberLabel(m).toUpperCase()}
              metaLine={rowMeta(m)}
              percentLine={percentLineForMember(m, i, amtMinor)}
              isLast={i === includedMembers.length - 1}
              amountNode={
                <Text
                  style={[
                    textStyles.numeric,
                    { color: palette.textPrimary, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {formatExpenseMajorAmount(major.replace(/,/g, ''), currency)}
                </Text>
              }
            />
          );
        })}
      </View>
    ) : (
      <Text
        style={{
          marginTop: space.gap,
          fontFamily: typography.fontFamily.mono.regular,
          fontSize: typography.fontSize.sm,
          color: palette.textMuted,
        }}
      >
        {t('expenses.add.modern.splitSheetSummaryEnterTotal')}
      </Text>
    );
  } else if (sheetIdx === 1) {
    body = (
      <View
        style={{
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          overflow: 'hidden',
        }}
      >
        {includedMembers.map((m, i) => {
          const amtMinor = computeMemberAmountMinorForPreview(
            splitType,
            m.id,
            i,
            includedIds,
            totalSanitized,
            equalPartsMajor,
            exactByUserId,
            percentByUserId,
            sharesByUserId,
          );
          return (
            <SplitSheetParticipantRow
              key={m.id}
              avatarLetter={memberLabel(m)}
              avatarUrl={m.avatar}
              titleUpper={memberLabel(m).toUpperCase()}
              metaLine={rowMeta(m)}
              percentLine={percentLineForMember(m, i, amtMinor)}
              isLast={i === includedMembers.length - 1}
              amountNode={
                <TextInput
                  value={exactByUserId[m.id] ?? ''}
                  onChangeText={(tx) =>
                    setExactByUserId((p) => ({ ...p, [m.id]: sanitizeAmountTyping(tx) }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={palette.textMuted}
                  style={inputAmountStyle}
                />
              }
            />
          );
        })}
      </View>
    );
  } else if (sheetIdx === 2) {
    body = (
      <View style={{ gap: space.gap }}>
        <View
          style={{
            borderRadius: radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.border,
            overflow: 'hidden',
          }}
        >
          {includedMembers.map((m, i) => {
            const amtMinor = computeMemberAmountMinorForPreview(
              splitType,
              m.id,
              i,
              includedIds,
              totalSanitized,
              equalPartsMajor,
              exactByUserId,
              percentByUserId,
              sharesByUserId,
            );
            const formatted =
              amtMinor !== null
                ? formatExpenseMajorAmount(minorToMajorString(amtMinor), currency)
                : '—';
            return (
              <SplitSheetParticipantRow
                key={m.id}
                avatarLetter={memberLabel(m)}
                avatarUrl={m.avatar}
                titleUpper={memberLabel(m).toUpperCase()}
                metaLine={rowMeta(m)}
                percentLine={percentLineForMember(m, i, amtMinor)}
                isLast={i === includedMembers.length - 1}
                amountNode={
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text
                      style={[
                        textStyles.numeric,
                        { color: palette.textPrimary, fontVariant: ['tabular-nums'] },
                      ]}
                    >
                      {formatted}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <TextInput
                        value={percentByUserId[m.id] ?? ''}
                        onChangeText={(tx) =>
                          setPercentByUserId((p) => ({
                            ...p,
                            [m.id]: tx.replace(/[^\d.]/g, ''),
                          }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={palette.textMuted}
                        style={{
                          minWidth: 44,
                          paddingVertical: 2,
                          fontFamily: typography.fontFamily.mono.medium,
                          fontSize: typography.fontSize.sm,
                          color: palette.textPrimary,
                          textAlign: 'right',
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.mono.medium,
                          fontSize: typography.fontSize.xs,
                          color: palette.textSecondary,
                        }}
                      >
                        %
                      </Text>
                    </View>
                  </View>
                }
              />
            );
          })}
        </View>
        <Text
          style={{
            textAlign: 'center',
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize['2xs'],
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.wide,
            textTransform: 'uppercase',
          }}
        >
          {t('expenses.add.modern.splitTotalPercent', { pct: formatPctTotal(percentTotal) })}
        </Text>
      </View>
    );
  } else {
    body = (
      <View
        style={{
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          overflow: 'hidden',
        }}
      >
        {includedMembers.map((m, i) => {
          const amtMinor = computeMemberAmountMinorForPreview(
            splitType,
            m.id,
            i,
            includedIds,
            totalSanitized,
            equalPartsMajor,
            exactByUserId,
            percentByUserId,
            sharesByUserId,
          );
          const formatted =
            amtMinor !== null
              ? formatExpenseMajorAmount(minorToMajorString(amtMinor), currency)
              : '—';
          return (
            <SplitSheetParticipantRow
              key={m.id}
              avatarLetter={memberLabel(m)}
              avatarUrl={m.avatar}
              titleUpper={memberLabel(m).toUpperCase()}
              metaLine={rowMeta(m)}
              percentLine={percentLineForMember(m, i, amtMinor)}
              isLast={i === includedMembers.length - 1}
              amountNode={
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text
                    style={[
                      textStyles.numeric,
                      { color: palette.textPrimary, fontVariant: ['tabular-nums'] },
                    ]}
                  >
                    {formatted}
                  </Text>
                  <TextInput
                    value={String(sharesByUserId[m.id] ?? 1)}
                    onChangeText={(tx) => {
                      const n = Number(tx.replace(/\D/g, ''));
                      setSharesByUserId((p) => ({
                        ...p,
                        [m.id]: Number.isFinite(n) && n > 0 ? n : 1,
                      }));
                    }}
                    keyboardType="number-pad"
                    style={{
                      width: 44,
                      fontFamily: typography.fontFamily.mono.medium,
                      fontSize: typography.fontSize.sm,
                      color: palette.textPrimary,
                      textAlign: 'right',
                    }}
                  />
                </View>
              }
            />
          );
        })}
      </View>
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: palette.borderStrong,
        width: 40,
        height: 4,
        borderRadius: radius.xs,
      }}
      backgroundStyle={{
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        backgroundColor: palette.sheetBackground,
      }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.gap * 10 + insets.bottom,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space.gap,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.sans.semiBold,
              fontSize: typography.fontSize.lg,
              color: palette.textPrimary,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            {t('expenses.add.modern.splitSheetTitle')}
          </Text>
          <Pressable
            onPress={dismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.modern.splitSheetCloseA11y')}
          >
            <Ionicons name="close" size={22} color={palette.textSecondary} />
          </Pressable>
        </View>

        <Text
          style={{
            fontFamily: typography.fontFamily.mono.medium,
            fontSize: typography.fontSize['2xs'],
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            marginBottom: space.gapXs,
          }}
        >
          {t('expenses.add.modern.splitSheetTotalLabel')}
        </Text>
        <Animated.View
          key={`${totalFormatted ?? '—'}-${currency}`}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(140)}
        >
          <Text
            style={[
              textStyles.numericLarge,
              { color: palette.textPrimary, marginBottom: space.gapMd },
            ]}
          >
            {totalFormatted ?? '—'}
          </Text>
        </Animated.View>

        <SplitTabBar value={splitType} onChange={onChangeSplitType} tabLabels={tabLabels} />
        {splitValidationMessageKey ? (
          <Text
            style={{
              marginTop: space.gapSm,
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              color: palette.errorText,
              letterSpacing: typography.letterSpacing.wide,
            }}
            accessibilityLiveRegion="polite"
          >
            {t(splitValidationMessageKey)}
          </Text>
        ) : null}

        <View
          style={{
            marginTop: space.gapMd,
            padding: space.gap,
            borderRadius: radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.border,
            backgroundColor: palette.white,
            gap: space.gapXs,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.xs,
              color: palette.textSecondary,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            }}
          >
            {summaryPrimary}
          </Text>
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: palette.borderSubtle,
              marginVertical: space.gapXs,
            }}
          />
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize.sm,
              color: palette.textPrimary,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
          >
            {summarySecondary}
          </Text>
        </View>

        <Animated.View
          key={splitType}
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(120)}
          style={{ marginTop: space.gapMd }}
        >
          {body}
        </Animated.View>

        {afterSplitCopy ? (
          <View style={{ marginTop: space.gapMd, gap: space.gapXs }}>
            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
              }}
            >
              {t('expenses.add.modern.splitSheetAfterHeading')}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.semiBold,
                fontSize: typography.fontSize.md,
                color: palette.textPrimary,
                letterSpacing: typography.letterSpacing.tight,
              }}
            >
              {afterSplitCopy}
            </Text>
          </View>
        ) : null}
      </BottomSheetScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: space.gap,
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.gap + insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.border,
          backgroundColor: palette.sheetBackground,
        }}
      >
        <Button
          variant="primary"
          labelCase="uppercase"
          label={t('expenses.add.modern.splitSheetConfirm')}
          accessibilityLabel={t('expenses.add.modern.splitSheetConfirm')}
          trailing="none"
          disabled={!splitConfirmEnabled}
          onPress={() => {
            if (!splitConfirmEnabled) return;
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
              () => undefined,
            );
            onSave();
          }}
        />
      </View>
    </BottomSheetModal>
  );
}
