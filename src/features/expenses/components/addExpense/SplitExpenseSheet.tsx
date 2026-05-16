import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

/** Participant list: below ~18 rows `ScrollView` is fine; above that, migrate to `BottomSheetFlatList` + header/footer. */
import type { ReactElement, RefObject } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, type AccessibilityState, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplitSheetParticipantRow } from '@/features/expenses/components/addExpense/SplitSheetParticipantRow';
import {
  splitTypeToSheetIndex,
  SplitTabBar,
} from '@/features/expenses/components/addExpense/SplitTabBar';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { getCurrencyDisplaySymbol } from '@/features/expenses/utils/currencyDisplaySymbol';
import {
  minorToMajorString,
  parseAmountToMinor,
  sanitizeAmountTyping,
  splitAmountDisplayParts,
} from '@/features/expenses/utils/amountParsing';
import { percentRemainingDisplayed } from '@/features/expenses/utils/addExpenseSubmitReadiness';
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
  type AfterSplitResult,
} from '@/features/expenses/utils/splitExpenseSheetBalances';
import {
  opacity,
  radius,
  size,
  space,
  spacing,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

export type SplitExpenseSheetProps = {
  sheetRef: RefObject<BottomSheetModal | null>;
  splitType: ExpenseSplitType;
  onChangeSplitType: (t: ExpenseSplitType) => void;
  includedMembers: GroupMemberRosterEntry[];
  totalAmountMajor: string;
  /** When set, the sheet total is editable and should update the same `amount` state as Add Expense. */
  onChangeTotalAmountMajor?: (nextSanitizedMajor: string) => void;
  currency: string;
  currentUserId: string | undefined;
  paidByUserId: string;
  exactByUserId: Readonly<Record<string, string>>;
  setExactByUserId: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  percentByUserId: Readonly<Record<string, string>>;
  setPercentByUserId: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  sharesByUserId: Readonly<Record<string, number>>;
  setSharesByUserId: (updater: (prev: Record<string, number>) => Record<string, number>) => void;
};

function areSplitExpenseSheetPropsEqual(
  a: SplitExpenseSheetProps,
  b: SplitExpenseSheetProps,
): boolean {
  return (
    a.sheetRef === b.sheetRef &&
    a.splitType === b.splitType &&
    a.onChangeSplitType === b.onChangeSplitType &&
    a.includedMembers === b.includedMembers &&
    a.totalAmountMajor === b.totalAmountMajor &&
    a.onChangeTotalAmountMajor === b.onChangeTotalAmountMajor &&
    a.currency === b.currency &&
    a.currentUserId === b.currentUserId &&
    a.paidByUserId === b.paidByUserId &&
    a.exactByUserId === b.exactByUserId &&
    a.percentByUserId === b.percentByUserId &&
    a.sharesByUserId === b.sharesByUserId &&
    a.setExactByUserId === b.setExactByUserId &&
    a.setPercentByUserId === b.setPercentByUserId &&
    a.setSharesByUserId === b.setSharesByUserId
  );
}

function formatPctTotal(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase())
    .join(' ');
}

function splitParticipantDisplayName(
  m: GroupMemberRosterEntry,
  currentUserId: string | undefined,
  t: (key: string) => string,
): string {
  if (m.id === currentUserId) return t('expenses.add.premium.splitParticipantYou');
  const u = m.username?.trim();
  if (u) return u.startsWith('@') ? u : `@${u}`;
  const n = m.name?.trim();
  if (n) return titleCaseWords(n);
  return m.id.slice(0, 6);
}

function splitParticipantAvatarLetter(displayTitle: string): string {
  return displayTitle.replace(/^@/, '').trim().slice(0, 1).toUpperCase();
}

type AfterSplitVisibleKind = Exclude<AfterSplitResult['kind'], 'hidden'>;

function afterSplitSectionColors(
  kind: AfterSplitVisibleKind,
  p: ReturnType<typeof useThemeColors>,
): {
  panelBg: string;
  accentBar: string;
  iconBg: string;
  iconColor: string;
  bodyColor: string;
} {
  switch (kind) {
    case 'getBack':
      return {
        panelBg: p.successSubtle,
        accentBar: p.successBorder,
        iconBg: p.overlayMedium,
        iconColor: p.successText,
        bodyColor: p.successText,
      };
    case 'owe':
      return {
        panelBg: p.warningSubtle,
        accentBar: p.warningBorder,
        iconBg: p.overlayMedium,
        iconColor: p.warningText,
        bodyColor: p.warningText,
      };
    default:
      return {
        panelBg: p.overlay,
        accentBar: p.borderStrong,
        iconBg: p.surfaceFloating,
        iconColor: p.textSecondary,
        bodyColor: p.textPrimary,
      };
  }
}

function SplitExpenseSheetView({
  sheetRef,
  splitType,
  onChangeSplitType,
  includedMembers,
  totalAmountMajor,
  onChangeTotalAmountMajor,
  currency,
  currentUserId,
  paidByUserId,
  exactByUserId,
  setExactByUserId,
  percentByUserId,
  setPercentByUserId,
  sharesByUserId,
  setSharesByUserId,
}: SplitExpenseSheetProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const insets = useSafeAreaInsets();
  const splitSheetSnapPoints = useMemo(() => ['72%', '90%'], []);

  const splitSheetTotalAmountSize = typography.fontSize['4xl'];
  const splitSheetTotalLineHeight = Math.round(
    splitSheetTotalAmountSize * typography.lineHeight.none,
  );

  const reduceMotion = useReducedMotion();

  const totalSanitized = totalAmountMajor.trim().replace(/,/g, '');
  const currencyGlyph = getCurrencyDisplaySymbol(currency);
  const totalAmountDisplayCore = useMemo(() => {
    if (totalSanitized === '') return '';
    const { integer, fraction } = splitAmountDisplayParts(totalSanitized);
    return `${integer}${fraction}`;
  }, [totalSanitized]);

  const includedIds = useMemo(() => includedMembers.map((m) => m.id), [includedMembers]);

  const typedSplitListMinHeight = useMemo((): number | undefined => {
    const n = includedMembers.length;
    if (n === 0) return undefined;
    return n * (size.touchMin + space.gap);
  }, [includedMembers.length]);

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

  const participantTitle = useCallback(
    (m: GroupMemberRosterEntry) => splitParticipantDisplayName(m, currentUserId, t),
    [currentUserId, t],
  );

  const participantAvatarLetter = useCallback(
    (m: GroupMemberRosterEntry) =>
      splitParticipantAvatarLetter(splitParticipantDisplayName(m, currentUserId, t)),
    [currentUserId, t],
  );

  const onEqualRowPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const totalMetaLine =
    includedMembers.length > 0
      ? t('expenses.add.modern.splitSheetTotalMeta', {
          count: includedMembers.length,
          currency,
        })
      : null;

  const rowMeta = useCallback(
    (m: GroupMemberRosterEntry): string | null => {
      if (m.id !== paidByUserId) return null;
      if (m.id === currentUserId) return t('expenses.add.modern.splitSheetRowPaidByYou');
      return t('expenses.add.modern.splitSheetRowPayer');
    },
    [currentUserId, paidByUserId, t],
  );

  const sheetIdx = splitTypeToSheetIndex(splitType);
  const [howExpanded, setHowExpanded] = useState(false);
  const [sharesEditStarted, setSharesEditStarted] = useState(false);
  const sharesWasInteractedRef = useRef(false);

  const howHeadingLineHeight = useMemo(
    () => Math.max(Math.round(typography.fontSize.xs * typography.lineHeight.snug), size.iconSm),
    [],
  );

  const howChevronLead = Math.round((howHeadingLineHeight - size.iconSm) / 2);

  useEffect(() => {
    setHowExpanded(false);
  }, [sheetIdx]);

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

  const howFormulaLine = useMemo(() => {
    switch (sheetIdx) {
      case 0:
        return t('expenses.add.modern.splitHowFormulaEqual');
      case 1:
        return t('expenses.add.modern.splitHowFormulaExact');
      case 2:
        return t('expenses.add.modern.splitHowFormulaPercent');
      default:
        return t('expenses.add.modern.splitHowFormulaShares');
    }
  }, [sheetIdx, t]);

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

  const percentAllFilled = useMemo(() => {
    if (includedMembers.length === 0) return false;
    for (const m of includedMembers) {
      if (!(percentByUserId[m.id] ?? '').trim()) return false;
    }
    return true;
  }, [includedMembers, percentByUserId]);

  const percentValidationUiCoversMessageKey = useMemo(() => {
    if (splitType !== 'percentage') return false;
    const v = activeSplitValidation;
    return (
      v.kind === 'percent_partial' ||
      v.kind === 'percent_gap' ||
      v.kind === 'percent_over' ||
      (v.kind === 'incomplete' &&
        (v.labelKey === 'expenses.add.validation.percentInvalid' ||
          v.labelKey === 'expenses.add.validation.percentRowExceeds100'))
    );
  }, [activeSplitValidation, splitType]);

  const percentValidationBanner = useMemo((): {
    message: string;
    severity: 'error' | 'warning';
  } | null => {
    if (splitType !== 'percentage') return null;
    const v = activeSplitValidation;
    const eps = 0.001;
    switch (v.kind) {
      case 'percent_partial':
        if (v.remainingToHundred <= eps && v.sumAssigned >= 100 - eps) {
          return {
            message: t('expenses.add.modern.splitPercentValidationEmptyAtFull', {
              assigned: formatPctTotal(v.sumAssigned),
            }),
            severity: 'warning',
          };
        }
        return {
          message: t('expenses.add.modern.splitPercentValidationPartial', {
            assigned: formatPctTotal(v.sumAssigned),
            remaining: formatPctTotal(v.remainingToHundred),
          }),
          severity: 'warning',
        };
      case 'percent_gap':
        return {
          message: t('expenses.add.modern.splitPercentValidationUnder', {
            assigned: formatPctTotal(Math.max(0, 100 - v.gapPercent)),
            remaining: formatPctTotal(v.gapPercent),
          }),
          severity: 'warning',
        };
      case 'percent_over':
        return {
          message: t('expenses.add.modern.splitPercentValidationOver', {
            over: formatPctTotal(v.overBy),
          }),
          severity: 'error',
        };
      case 'incomplete':
        if (v.labelKey === 'expenses.add.validation.percentInvalid') {
          return { message: t('expenses.add.validation.percentInvalid'), severity: 'error' };
        }
        if (v.labelKey === 'expenses.add.validation.percentRowExceeds100') {
          return { message: t('expenses.add.validation.percentRowExceeds100'), severity: 'error' };
        }
        return null;
      default:
        return null;
    }
  }, [activeSplitValidation, splitType, t]);

  const splitValidationMessageKey = useMemo(() => {
    if (percentValidationUiCoversMessageKey) {
      return '';
    }
    const base = getSplitValidationMessageKey(activeSplitValidation);
    if (
      splitType === 'shares' &&
      !sharesEditStarted &&
      base === 'expenses.add.validation.sharesInvalid'
    ) {
      return '';
    }
    if (base !== '') return base;
    if (activeSplitValidation.kind === 'perfect' && !payerInSplit) {
      return 'expenses.add.validation.payerMustBeOnSplit';
    }
    return '';
  }, [
    activeSplitValidation,
    payerInSplit,
    percentValidationUiCoversMessageKey,
    sharesEditStarted,
    splitType,
  ]);

  const percentRollupColor = useMemo(() => {
    if (sheetIdx !== 2) return palette.textMuted;
    if (!percentAllFilled) return palette.textMuted;
    const eps = 0.001;
    if (Math.abs(percentTotal - 100) < eps) return palette.successText;
    if (percentTotal > 100 + eps) return palette.errorText;
    return palette.warningText;
  }, [
    palette.errorText,
    palette.successText,
    palette.textMuted,
    palette.warningText,
    percentAllFilled,
    percentTotal,
    sheetIdx,
  ]);

  const percentExceedsHundred = useMemo(() => {
    const eps = 0.001;
    if (activeSplitValidation.kind === 'percent_over') return true;
    return percentTotal > 100 + eps;
  }, [activeSplitValidation, percentTotal]);

  const splitListErrorBorderStyle = useMemo(
    () => ({
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: palette.errorText,
    }),
    [palette.errorText],
  );

  const rollupCoachStyle = useMemo(
    () => ({
      textAlign: 'center' as const,
      fontFamily: typography.fontFamily.mono.regular,
      fontSize: typography.fontSize['2xs'],
      color: palette.textMuted,
      letterSpacing: typography.letterSpacing.wide,
      textTransform: 'uppercase' as const,
    }),
    [palette.textMuted],
  );

  const exactAllocationRollup = useMemo(() => {
    if (sheetIdx !== 1 || totalMinor === null || includedMembers.length === 0) return null;
    let sumFilled = 0;
    let allFilled = true;
    for (const m of includedMembers) {
      const raw = (exactByUserId[m.id] ?? '').trim().replace(/,/g, '');
      if (!raw) {
        allFilled = false;
        continue;
      }
      const mi = parseAmountToMinor(raw);
      if (mi !== null) {
        sumFilled += mi;
      } else {
        allFilled = false;
      }
    }
    if (sumFilled > totalMinor) {
      return { kind: 'over' as const, minor: sumFilled - totalMinor };
    }
    if (allFilled && sumFilled === totalMinor) {
      return { kind: 'perfect' as const };
    }
    const remaining = totalMinor - sumFilled;
    if (!allFilled && remaining > 0) {
      return { kind: 'under' as const, minor: remaining };
    }
    if (!allFilled) {
      return { kind: 'openRows' as const };
    }
    return { kind: 'under' as const, minor: Math.max(0, remaining) };
  }, [sheetIdx, totalMinor, includedMembers, exactByUserId]);

  const exactRollupColor = useMemo(() => {
    if (!exactAllocationRollup) return palette.textMuted;
    if (exactAllocationRollup.kind === 'perfect') return palette.successText;
    if (exactAllocationRollup.kind === 'over') return palette.errorText;
    return palette.warningText;
  }, [
    exactAllocationRollup,
    palette.errorText,
    palette.successText,
    palette.textMuted,
    palette.warningText,
  ]);

  const sharesTotalWeight = useMemo(() => {
    if (sheetIdx !== 3 || includedMembers.length === 0) return null;
    let s = 0;
    for (const m of includedMembers) {
      const raw = sharesByUserId[m.id];
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return null;
      s += Math.floor(raw);
    }
    return s;
  }, [sheetIdx, includedMembers, sharesByUserId]);

  const sharesHasInvalidRow = useMemo(() => {
    if (sheetIdx !== 3 || includedMembers.length === 0) return false;
    for (const m of includedMembers) {
      const raw = sharesByUserId[m.id];
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return true;
    }
    return false;
  }, [sheetIdx, includedMembers, sharesByUserId]);

  const sharesSurfaceFieldErrors = useMemo(
    () => sharesHasInvalidRow && sharesEditStarted,
    [sharesEditStarted, sharesHasInvalidRow],
  );

  useEffect(() => {
    if (sheetIdx !== 3) return;
    if (sharesWasInteractedRef.current && sharesHasInvalidRow) {
      setSharesEditStarted(true);
    }
  }, [sheetIdx, sharesHasInvalidRow]);

  const sharesRollupColor = useMemo(() => {
    if (sheetIdx !== 3) return palette.textMuted;
    if (sharesTotalWeight !== null) return palette.successText;
    if (sharesSurfaceFieldErrors) return palette.warningText;
    return palette.textMuted;
  }, [
    palette.successText,
    palette.textMuted,
    palette.warningText,
    sharesSurfaceFieldErrors,
    sharesTotalWeight,
    sheetIdx,
  ]);

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

  const afterSplitHighlight = useMemo(() => {
    if (!afterSplitCopy || sheetIdx !== 0 || afterSplit.kind === 'hidden') return null;
    return afterSplitSectionColors(afterSplit.kind, palette);
  }, [afterSplit.kind, afterSplitCopy, palette, sheetIdx]);

  const showAfterSplitSection = Boolean(afterSplitHighlight);

  const onSharesAmountChange = useCallback(
    (memberId: string, tx: string) => {
      sharesWasInteractedRef.current = true;
      setSharesEditStarted(true);
      const n = Number(tx.replace(/\D/g, ''));
      setSharesByUserId((p) => ({
        ...p,
        [memberId]: Number.isFinite(n) && n > 0 ? n : 0,
      }));
    },
    [setSharesByUserId],
  );

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  const inputAmountStyle = useMemo(
    () => ({
      minWidth: 96,
      minHeight: size.touchMin,
      paddingVertical: space.gapXs,
      paddingHorizontal: space.gapXs,
      fontFamily: typography.fontFamily.mono.medium,
      fontSize: typography.fontSize.lg,
      color: palette.textPrimary,
      textAlign: 'right' as const,
    }),
    [palette.textPrimary],
  );

  const splitSheetRowAmountTextStyle = useMemo(
    () => ({
      fontFamily: typography.fontFamily.mono.medium,
      fontSize: typography.fontSize.lg,
      lineHeight: typography.fontSize.lg * typography.lineHeight.none,
      fontWeight: typography.fontWeight.medium,
      fontVariant: ['tabular-nums' as const],
      color: palette.textPrimary,
    }),
    [palette.textPrimary],
  );

  let body: ReactElement;
  if (includedMembers.length === 0) {
    body = (
      <Text
        style={{
          marginTop: space.gapSm,
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
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: palette.surfaceElevated,
        }}
      >
        {includedMembers.map((m, i) => {
          const major = equalPartsMajor[i] ?? '0';
          return (
            <SplitSheetParticipantRow
              key={m.id}
              avatarLetter={participantAvatarLetter(m)}
              avatarUrl={m.avatar}
              titleUpper={participantTitle(m)}
              metaLine={rowMeta(m)}
              percentLine={null}
              isLast={i === includedMembers.length - 1}
              onRowPress={onEqualRowPress}
              rowVerticalDensity="comfortable"
              amountNode={
                <Text style={splitSheetRowAmountTextStyle}>
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
          marginTop: space.gapSm,
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
        collapsable={false}
        style={{
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: palette.surfaceElevated,
          ...(exactAllocationRollup?.kind === 'over' ? splitListErrorBorderStyle : {}),
        }}
      >
        <View
          collapsable={false}
          style={
            typedSplitListMinHeight != null ? { minHeight: typedSplitListMinHeight } : undefined
          }
        >
          {includedMembers.map((m, i) => {
            return (
              <View key={m.id} collapsable={false}>
                <SplitSheetParticipantRow
                  includeRowInAccessibilityTree={false}
                  avatarLetter={participantAvatarLetter(m)}
                  avatarUrl={m.avatar}
                  titleUpper={participantTitle(m)}
                  metaLine={rowMeta(m)}
                  percentLine={null}
                  isLast={i === includedMembers.length - 1}
                  amountNode={
                    <View
                      style={{
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        minHeight: size.touchMin,
                      }}
                    >
                      <BottomSheetTextInput
                        value={exactByUserId[m.id] ?? ''}
                        onChangeText={(tx) =>
                          setExactByUserId((p) => ({ ...p, [m.id]: sanitizeAmountTyping(tx) }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={palette.textMuted}
                        accessibilityLabel={t('expenses.add.modern.splitExactInputA11y', {
                          name: participantTitle(m),
                        })}
                        accessibilityHint={t('expenses.add.modern.splitExactInputHint')}
                        accessibilityState={
                          {
                            invalid: exactAllocationRollup?.kind === 'over',
                          } as AccessibilityState
                        }
                        style={inputAmountStyle}
                      />
                    </View>
                  }
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  } else if (sheetIdx === 2) {
    body = (
      <View
        collapsable={false}
        style={{
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: palette.surfaceElevated,
          ...(percentExceedsHundred ? splitListErrorBorderStyle : {}),
        }}
      >
        <View
          collapsable={false}
          style={
            typedSplitListMinHeight != null ? { minHeight: typedSplitListMinHeight } : undefined
          }
        >
          {includedMembers.map((m, i) => {
            return (
              <View key={m.id} collapsable={false}>
                <SplitSheetParticipantRow
                  includeRowInAccessibilityTree={false}
                  avatarLetter={participantAvatarLetter(m)}
                  avatarUrl={m.avatar}
                  titleUpper={participantTitle(m)}
                  metaLine={rowMeta(m)}
                  percentLine={null}
                  isLast={i === includedMembers.length - 1}
                  amountNode={
                    <View
                      style={{
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        minHeight: size.touchMin,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: space.gapXs,
                        }}
                      >
                        <BottomSheetTextInput
                          value={percentByUserId[m.id] ?? ''}
                          onChangeText={(tx) =>
                            setPercentByUserId((p) => ({
                              ...p,
                              [m.id]: sanitizeAmountTyping(tx),
                            }))
                          }
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={palette.textMuted}
                          accessibilityLabel={t('expenses.add.modern.splitPercentInputA11y', {
                            name: participantTitle(m),
                          })}
                          accessibilityHint={t('expenses.add.modern.splitPercentInputHint')}
                          accessibilityState={
                            { invalid: percentExceedsHundred } as AccessibilityState
                          }
                          style={{
                            minWidth: 52,
                            minHeight: size.touchMin,
                            paddingVertical: space.gapXs,
                            paddingHorizontal: space.gapXs,
                            fontFamily: typography.fontFamily.mono.medium,
                            fontSize: typography.fontSize.lg,
                            color: palette.textPrimary,
                            textAlign: 'right',
                          }}
                        />
                        <Text
                          accessibilityElementsHidden
                          importantForAccessibility="no"
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
              </View>
            );
          })}
        </View>
      </View>
    );
  } else {
    body = (
      <View
        collapsable={false}
        style={{
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: palette.surfaceElevated,
          ...(sharesSurfaceFieldErrors ? splitListErrorBorderStyle : {}),
        }}
      >
        <View
          collapsable={false}
          style={
            typedSplitListMinHeight != null ? { minHeight: typedSplitListMinHeight } : undefined
          }
        >
          {includedMembers.map((m, i) => {
            const shareRowAmountCaption =
              totalMinor !== null && sharesTotalWeight !== null
                ? (() => {
                    const minor = computeMemberAmountMinorForPreview(
                      'shares',
                      m.id,
                      i,
                      includedIds,
                      totalSanitized,
                      null,
                      exactByUserId,
                      percentByUserId,
                      sharesByUserId,
                    );
                    return minor !== null
                      ? formatExpenseMajorAmount(minorToMajorString(minor), currency)
                      : null;
                  })()
                : null;
            const shareRowInvalid = (() => {
              const raw = sharesByUserId[m.id];
              return typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1;
            })();
            const shareRowShowInvalid = shareRowInvalid && sharesSurfaceFieldErrors;
            return (
              <View key={m.id} collapsable={false}>
                <SplitSheetParticipantRow
                  includeRowInAccessibilityTree={false}
                  avatarLetter={participantAvatarLetter(m)}
                  avatarUrl={m.avatar}
                  titleUpper={participantTitle(m)}
                  metaLine={rowMeta(m)}
                  percentLine={shareRowAmountCaption}
                  isLast={i === includedMembers.length - 1}
                  amountNode={
                    <View
                      style={{
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        minHeight: size.touchMin,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: space.gapXs,
                        }}
                      >
                        <BottomSheetTextInput
                          value={(() => {
                            const v = sharesByUserId[m.id];
                            if (v === undefined || v === 0 || !Number.isFinite(v)) return '';
                            return String(Math.floor(v));
                          })()}
                          onChangeText={(tx) => onSharesAmountChange(m.id, tx)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={palette.textMuted}
                          accessibilityLabel={t('expenses.add.modern.splitSharesInputA11y', {
                            name: participantTitle(m),
                          })}
                          accessibilityHint={t('expenses.add.modern.splitSharesInputHint')}
                          accessibilityState={
                            { invalid: shareRowShowInvalid } as AccessibilityState
                          }
                          style={{
                            minWidth: 96,
                            minHeight: size.touchMin,
                            paddingVertical: space.gapXs,
                            paddingHorizontal: space.gapXs,
                            fontFamily: typography.fontFamily.mono.medium,
                            fontSize: typography.fontSize.lg,
                            color: palette.textPrimary,
                            textAlign: 'right',
                          }}
                        />
                        <Text
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                          style={{
                            fontFamily: typography.fontFamily.mono.medium,
                            fontSize: typography.fontSize.xs,
                            color: palette.textSecondary,
                          }}
                        >
                          {t('expenses.add.modern.splitSharesInputSuffix')}
                        </Text>
                      </View>
                    </View>
                  }
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  const showParticipantSplitList =
    includedMembers.length > 0 && (sheetIdx !== 0 || Boolean(equalPartsMajor));

  const splitTabFooter = showParticipantSplitList ? (
    <View
      style={{
        marginTop: space.gapSm,
        gap: space.gapXs,
        justifyContent: 'center',
      }}
    >
      {sheetIdx === 1 && exactAllocationRollup ? (
        <>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: exactRollupColor,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
            accessibilityRole="text"
          >
            {exactAllocationRollup.kind === 'perfect'
              ? t('expenses.add.modern.splitExactRollupBalanced')
              : exactAllocationRollup.kind === 'over'
                ? t('expenses.add.modern.splitExactRollupOver', {
                    amount: formatExpenseMajorAmount(
                      minorToMajorString(exactAllocationRollup.minor),
                      currency,
                    ),
                  })
                : exactAllocationRollup.kind === 'openRows'
                  ? t('expenses.add.modern.splitExactRollupOpenRows')
                  : t('expenses.add.modern.splitExactRollupLeft', {
                      amount: formatExpenseMajorAmount(
                        minorToMajorString(exactAllocationRollup.minor),
                        currency,
                      ),
                    })}
          </Text>
          {exactAllocationRollup.kind === 'over' ? (
            <Text style={rollupCoachStyle} accessibilityRole="text">
              {t('expenses.add.modern.splitExactRollupOverCoach')}
            </Text>
          ) : null}
        </>
      ) : null}
      {sheetIdx === 2 && !percentValidationBanner ? (
        <>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: percentRollupColor,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
            accessibilityRole="text"
          >
            {percentAllFilled
              ? t('expenses.add.modern.splitTotalPercent', { pct: formatPctTotal(percentTotal) })
              : t('expenses.add.modern.splitPercentRollupPartial', {
                  pct: formatPctTotal(percentTotal),
                })}
          </Text>
          {!percentAllFilled ? (
            <Text
              style={{
                textAlign: 'center',
                fontFamily: typography.fontFamily.mono.regular,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.wide,
                textTransform: 'uppercase',
              }}
              accessibilityRole="text"
            >
              {t('expenses.add.modern.splitPercentRollupPartialHint')}
            </Text>
          ) : Math.abs(percentTotal - 100) < 0.001 ? null : percentTotal > 100 ? (
            <>
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: typography.fontFamily.mono.medium,
                  fontSize: typography.fontSize['2xs'],
                  color: palette.errorText,
                  letterSpacing: typography.letterSpacing.wide,
                  textTransform: 'uppercase',
                }}
                accessibilityRole="text"
              >
                {t('expenses.add.modern.splitPercentRollupOverBy', {
                  pct: formatPctTotal(percentTotal - 100),
                })}
              </Text>
              <Text style={rollupCoachStyle} accessibilityRole="text">
                {t('expenses.add.modern.splitPercentRollupOverCoach')}
              </Text>
            </>
          ) : (
            <Text
              style={{
                textAlign: 'center',
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.warningText,
                letterSpacing: typography.letterSpacing.wide,
                textTransform: 'uppercase',
              }}
              accessibilityRole="text"
            >
              {t('expenses.add.modern.splitPercentRollupLeft', {
                pct: formatPctTotal(percentRemainingDisplayed(percentTotal)),
              })}
            </Text>
          )}
        </>
      ) : null}
      {sheetIdx === 3 ? (
        <>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: sharesRollupColor,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
            accessibilityRole="text"
          >
            {sharesTotalWeight !== null
              ? t('expenses.add.modern.splitSharesRollupWeight', { count: sharesTotalWeight })
              : t('expenses.add.modern.splitSharesRollupPartial')}
          </Text>
          {sharesTotalWeight === null && !sharesSurfaceFieldErrors ? (
            <Text style={rollupCoachStyle} accessibilityRole="text">
              {t('expenses.add.modern.splitSharesRollupRelativeHint')}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  ) : null;

  const tabBodyWithFooter = (
    <>
      {body}
      {splitTabFooter}
    </>
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={splitSheetSnapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture
      android_keyboardInputMode={Platform.OS === 'android' ? 'adjustResize' : undefined}
      topInset={insets.top}
      bottomInset={insets.bottom}
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
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: Math.max(space.sectionGapSm + space.gapSm, insets.bottom + space.gapLg),
          width: '100%',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space.gapMd,
          }}
        >
          <Text
            style={{
              flex: 1,
              minWidth: 0,
              marginRight: space.gapSm,
              fontFamily: typography.fontFamily.sans.semiBold,
              fontSize: typography.fontSize.lg,
              color: palette.textPrimary,
              letterSpacing: typography.letterSpacing.tight,
            }}
            numberOfLines={2}
          >
            {t('expenses.add.modern.splitSheetTitle')}
          </Text>
          <Pressable
            onPress={dismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.modern.splitSheetCloseA11y')}
            style={{ marginRight: spacing['1.5'] }}
          >
            <Ionicons name="close" size={20} color={palette.textMuted} />
          </Pressable>
        </View>

        <View style={{ marginBottom: space.gapSm }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: palette.textSecondary,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              marginBottom: space.gapXs,
            }}
          >
            {t('expenses.add.modern.splitSheetTotalLabel')}
          </Text>
          {onChangeTotalAmountMajor ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: Platform.OS === 'android' ? 'center' : 'baseline',
                flexWrap: 'nowrap',
                gap: space.gapSm,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.mono.medium,
                  fontSize: splitSheetTotalAmountSize,
                  lineHeight: splitSheetTotalLineHeight,
                  fontWeight: typography.fontWeight.medium,
                  color:
                    totalSanitized !== '' && Number.isFinite(Number(totalSanitized))
                      ? palette.textPrimary
                      : palette.textSecondary,
                  letterSpacing: typography.letterSpacing.wide,
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {currencyGlyph}
              </Text>
              <BottomSheetTextInput
                value={totalAmountDisplayCore}
                onChangeText={(raw) => {
                  const next = sanitizeAmountTyping(raw);
                  if (next === totalSanitized) return;
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                    () => undefined,
                  );
                  onChangeTotalAmountMajor(next);
                }}
                keyboardType="decimal-pad"
                keyboardAppearance={themeMode === 'dark' ? 'dark' : 'light'}
                cursorColor={palette.accent}
                selectionColor={palette.accent}
                accessibilityLabel={t('expenses.add.modern.splitSheetTotalInputA11y')}
                accessibilityHint={t('expenses.add.modern.splitSheetTotalInputHint')}
                placeholder="0"
                placeholderTextColor={palette.textMuted}
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 96,
                  fontFamily: typography.fontFamily.mono.bold,
                  fontSize: splitSheetTotalAmountSize,
                  lineHeight: splitSheetTotalLineHeight,
                  fontWeight: typography.fontWeight.bold,
                  letterSpacing: typography.letterSpacing.tight,
                  fontVariant: ['tabular-nums'],
                  color: palette.textPrimary,
                  textAlign: 'left',
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  margin: 0,
                  ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
                }}
              />
            </View>
          ) : reduceMotion ? (
            <View key={`${totalFormatted ?? '—'}-${currency}`}>
              <Text style={[textStyles.numericLarge, { color: palette.textPrimary }]}>
                {totalFormatted ?? '—'}
              </Text>
            </View>
          ) : (
            <Animated.View
              key={`${totalFormatted ?? '—'}-${currency}`}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(140)}
            >
              <Text style={[textStyles.numericLarge, { color: palette.textPrimary }]}>
                {totalFormatted ?? '—'}
              </Text>
            </Animated.View>
          )}
          {totalMetaLine ? (
            <Text
              style={{
                marginTop: space.gapXs,
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
              }}
            >
              {totalMetaLine}
            </Text>
          ) : null}
        </View>

        <SplitTabBar value={splitType} onChange={onChangeSplitType} tabLabels={tabLabels} />
        {percentValidationBanner ? (
          <Text
            style={{
              marginTop: space.gapSm,
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              color:
                percentValidationBanner.severity === 'error'
                  ? palette.errorText
                  : palette.warningText,
              letterSpacing: typography.letterSpacing.wide,
            }}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {percentValidationBanner.message}
          </Text>
        ) : null}
        {!percentValidationBanner && splitValidationMessageKey ? (
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

        {splitType === 'adjust' ? (
          <Text
            style={{
              marginTop: space.gapSm,
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
            }}
            accessibilityRole="text"
          >
            {t('expenses.add.modern.splitAdjustHydratedHint')}
          </Text>
        ) : null}

        <View key={splitType} collapsable={false} style={{ marginTop: space.gapSm }}>
          {tabBodyWithFooter}
        </View>

        <View style={{ marginTop: space.gapMd }}>
          <View
            style={{
              borderRadius: radius.md,
              backgroundColor: palette.surfaceElevated,
              overflow: 'hidden',
              alignItems: 'stretch',
            }}
          >
            {afterSplitHighlight ? (
              <>
                <View
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${t('expenses.add.modern.splitSheetAfterHeading')}. ${afterSplitCopy}`}
                  style={{
                    paddingTop: space.gapSm,
                    paddingBottom: space.gapMd,
                    paddingHorizontal: space.gap,
                    gap: space.gapSm,
                    backgroundColor: afterSplitHighlight.panelBg,
                    borderLeftWidth: 2,
                    borderLeftColor: afterSplitHighlight.accentBar,
                  }}
                >
                  <Text
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    style={{
                      fontFamily: typography.fontFamily.mono.medium,
                      fontSize: typography.fontSize['2xs'],
                      color: palette.textSecondary,
                      letterSpacing: typography.letterSpacing.wide,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('expenses.add.modern.splitSheetAfterHeading')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapSm }}>
                    {afterSplit.kind === 'getBack' ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radius.full,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: afterSplitHighlight.iconBg,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: afterSplitHighlight.accentBar,
                        }}
                        accessibilityElementsHidden
                      >
                        <Ionicons
                          name="arrow-down"
                          size={20}
                          color={afterSplitHighlight.iconColor}
                        />
                      </View>
                    ) : null}
                    {afterSplit.kind === 'owe' ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radius.full,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: afterSplitHighlight.iconBg,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: afterSplitHighlight.accentBar,
                        }}
                        accessibilityElementsHidden
                      >
                        <Ionicons name="arrow-up" size={20} color={afterSplitHighlight.iconColor} />
                      </View>
                    ) : null}
                    {afterSplit.kind === 'even' ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radius.full,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: afterSplitHighlight.iconBg,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: afterSplitHighlight.accentBar,
                        }}
                        accessibilityElementsHidden
                      >
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={afterSplitHighlight.iconColor}
                        />
                      </View>
                    ) : null}
                    <Text
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                      style={{
                        flex: 1,
                        fontFamily: typography.fontFamily.sans.semiBold,
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: afterSplitHighlight.bodyColor,
                        letterSpacing: typography.letterSpacing.tight,
                      }}
                    >
                      {afterSplitCopy}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    marginLeft: space.gap,
                    marginRight: space.gap,
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: palette.borderSubtle,
                    opacity: opacity.subtle,
                  }}
                />
              </>
            ) : null}
            <Pressable
              onPress={() => setHowExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={t('expenses.add.modern.splitHowHeading')}
              accessibilityHint={t('expenses.add.modern.splitHowHeadingHint')}
              accessibilityState={{ expanded: howExpanded }}
              style={({ pressed }) => ({
                alignSelf: 'stretch',
                minHeight: size.touchMin,
                justifyContent: 'center',
                paddingVertical: space.gapSm,
                paddingHorizontal: space.gap,
                backgroundColor: pressed ? palette.surfaceFloating : 'transparent',
                marginTop: showAfterSplitSection ? space.gap : 0,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: space.gapSm,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: typography.fontFamily.mono.medium,
                    fontSize: typography.fontSize.xs,
                    lineHeight: howHeadingLineHeight,
                    color: palette.textMuted,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
                  }}
                  numberOfLines={2}
                >
                  {t('expenses.add.modern.splitHowHeading')}
                </Text>
                <View style={{ paddingTop: howChevronLead, flexShrink: 0 }}>
                  <Ionicons
                    name={howExpanded ? 'chevron-up' : 'chevron-forward'}
                    size={size.iconSm}
                    color={palette.textMuted}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </View>
              </View>
            </Pressable>
            {howExpanded ? (
              <View
                style={{
                  paddingHorizontal: space.gap,
                  paddingTop: space.gapMd,
                  paddingBottom: space.gapMd,
                  gap: space.gapSm,
                  backgroundColor: palette.surfaceFloating,
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
                    opacity: opacity.subtle,
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
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: palette.borderSubtle,
                    opacity: opacity.subtle,
                  }}
                />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.medium,
                    fontSize: typography.fontSize.xs,
                    color: palette.textSecondary,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                  }}
                  accessibilityRole="text"
                >
                  {t('expenses.add.modern.splitHowFormulaKicker')}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
                    color: palette.textPrimary,
                    letterSpacing: typography.letterSpacing.normal,
                  }}
                  accessibilityRole="text"
                >
                  {howFormulaLine}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export const SplitExpenseSheet = memo(SplitExpenseSheetView, areSplitExpenseSheetPropsEqual);
