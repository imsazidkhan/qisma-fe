import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { mapExpenseCreateError } from '@/features/expenses/api/expensesApi';
import { AddPersonButton } from '@/features/expenses/components/addExpense/AddPersonButton';
import { AmountHero } from '@/features/expenses/components/addExpense/AmountHero';
import { FloatingCTA } from '@/features/expenses/components/addExpense/FloatingCTA';
import { MemberPickSheet } from '@/features/expenses/components/addExpense/MemberPickSheet';
import {
  MetaPickSheet,
  ymdFromDate,
} from '@/features/expenses/components/addExpense/MetaPickSheet';
import { ParticipantRow } from '@/features/expenses/components/addExpense/ParticipantRow';
import { SectionCard } from '@/features/expenses/components/addExpense/SectionCard';
import { SectionLabel } from '@/features/expenses/components/addExpense/SectionLabel';
import { SplitExpenseSheet } from '@/features/expenses/components/addExpense/SplitExpenseSheet';
import { SplitPreviewCard } from '@/features/expenses/components/addExpense/SplitPreviewCard';

import { useExpenseSplitState } from '@/features/expenses/hooks/useExpenseSplitState';
import { useExpenseTitleClassify } from '@/features/expenses/hooks/useExpenseTitleClassify';
import { useExpenseWrite } from '@/features/expenses/hooks/useExpenseWrite';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import {
  expenseStructuredDraftFromClassify,
  type ExpenseStructuredDraft,
} from '@/features/expenses/types/expenseTaxonomy.types';
import {
  firstAddExpenseSubmitBlocker,
  firstSplitSheetDismissBlocker,
} from '@/features/expenses/utils/addExpenseSubmitReadiness';
import { parseAmountToMinor } from '@/features/expenses/utils/amountParsing';
import { buildCreateExpenseBodyFromForm } from '@/features/expenses/utils/buildCreateExpenseBodyFromForm';
import { computeParticipantPreview } from '@/features/expenses/utils/computeParticipantPreview';
import {
  validateLocalSplitForm,
  type LocalSplitFormState,
} from '@/features/expenses/utils/localExpenseSplit';
import { useGroupMemberProfile } from '@/features/groups/hooks/useGroupDetail';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  radius,
  size as sz,
  space,
  typography,
  useThemeColors,
  useThemeMode,
  zIndex,
} from '@/theme';

export type AddExpenseScreenProps = {
  groupId: string;
  onClose: () => void;
};

function splitMainRowTitle(t: (k: string) => string, splitType: ExpenseSplitType): string {
  switch (splitType) {
    case 'equal':
      return t('expenses.add.modern.splitEqually');
    case 'exact':
      return t('expenses.add.modern.splitByExact');
    case 'percentage':
      return t('expenses.add.modern.splitByPercent');
    case 'shares':
      return t('expenses.add.modern.splitByShare');
    default:
      return t('expenses.add.modern.splitEqually');
  }
}

function memberDisplayName(
  m: GroupMemberRosterEntry,
  meId: string | undefined,
  t: (k: string) => string,
): string {
  if (m.id === meId) return t('expenses.add.premium.splitParticipantYou');
  return m.name?.trim() || m.username?.trim() || m.id.slice(0, 6);
}

function memberInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? '?').toUpperCase();
}

export function AddExpenseScreen({ groupId, onClose }: AddExpenseScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const insets = useSafeAreaInsets();
  const { data: me } = useAuthMe();
  const groupQuery = useGroupMemberProfile(isUuid(groupId) ? groupId : undefined);
  const rosterQuery = useGroupMembers(groupId, { enabled: isUuid(groupId) });
  const roster = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [dateYmd, setDateYmd] = useState(() => ymdFromDate(new Date()));
  const [paidByUserId, setPaidByUserId] = useState('');
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [didSeed, setDidSeed] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string | undefined>(undefined);
  const [structuredDraft, setStructuredDraft] = useState<ExpenseStructuredDraft | null>(null);
  const [userCategoryOverride, setUserCategoryOverride] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const classifyQuery = useExpenseTitleClassify(title);
  const classifyData = classifyQuery.data;
  const classifyMeta = classifyData?.classification;
  const titleReadyForClassify = title.trim().length >= 3;
  const shouldAutofillCategory =
    titleReadyForClassify &&
    classifyMeta?.isFallback !== true &&
    classifyMeta?.shouldPromptCorrection === false &&
    Boolean(classifyData?.category);

  const {
    splitType,
    setSplitType,
    exactByUserId,
    setExactByUserId,
    percentByUserId,
    setPercentByUserId,
    sharesByUserId,
    setSharesByUserId,
    adjustFixedByUserId,
    adjustRemainderUserId,
  } = useExpenseSplitState(includedIds);

  const amountMajorNormalized = amount.trim().replace(/,/g, '');
  const debouncedAmountMajor = useDebouncedValue(amountMajorNormalized, 450);
  const lastExactSplitTotalBaselineRef = useRef<string | null>(null);

  /**
   * Exact line amounts target a specific total. When the expense total changes, those
   * figures are no longer meaningful — clear them after the amount field settles so
   * Equal / % / shares keep working off the new total without manual mismatch hunting.
   */
  useEffect(() => {
    if (splitType !== 'exact') {
      lastExactSplitTotalBaselineRef.current = debouncedAmountMajor;
      return;
    }

    const prev = lastExactSplitTotalBaselineRef.current;
    const cur = debouncedAmountMajor;

    if (prev === null) {
      lastExactSplitTotalBaselineRef.current = cur;
      return;
    }

    if (prev === cur) return;

    const prevMinor = parseAmountToMinor(prev);
    const curMinor = parseAmountToMinor(cur);
    const totalDroppedInvalid = prevMinor !== null && curMinor === null;
    const totalChanged = prevMinor !== null && curMinor !== null && prevMinor !== curMinor;

    if (totalDroppedInvalid || totalChanged) {
      setExactByUserId((p) => {
        const next = { ...p };
        for (const id of includedIds) {
          next[id] = '';
        }
        return next;
      });
    }

    lastExactSplitTotalBaselineRef.current = cur;
  }, [debouncedAmountMajor, includedIds, setExactByUserId, splitType]);

  const writeTarget = useMemo(() => ({ mode: 'create' as const, groupId }), [groupId]);
  const saveMutation = useExpenseWrite(writeTarget);
  const { isOnline, isReady } = useNetworkStatus();
  const offline = isReady && !isOnline;

  const splitSheetRef = useRef<BottomSheetModal | null>(null);
  const memberSheetRef = useRef<BottomSheetModal | null>(null);
  const metaSheetRef = useRef<BottomSheetModal | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);
  const noteInputRef = useRef<TextInput | null>(null);

  const activeRoster = useMemo(() => roster.filter((r) => r.status === 'active'), [roster]);
  const activeRosterIds = useMemo(() => activeRoster.map((r) => r.id), [activeRoster]);

  useEffect(() => {
    if (didSeed || rosterQuery.isPending) return;
    setIncludedIds([...activeRosterIds]);
    if (activeRosterIds.length > 0) {
      if (me?.id && activeRosterIds.includes(me.id)) {
        setPaidByUserId(me.id);
      } else {
        setPaidByUserId(activeRosterIds[0] ?? '');
      }
    }
    setDidSeed(true);
  }, [activeRosterIds, didSeed, me?.id, rosterQuery.isPending]);

  useEffect(() => {
    if (includedIds.length === 0) return;
    if (!includedIds.includes(paidByUserId)) {
      const first = includedIds[0];
      if (first) setPaidByUserId(first);
    }
  }, [includedIds, paidByUserId]);

  useEffect(() => {
    setUserCategoryOverride(false);
  }, [title]);

  useEffect(() => {
    if (!shouldAutofillCategory || !classifyData?.category || userCategoryOverride) return;
    setExpenseCategory(classifyData.category.slug);
    setStructuredDraft(expenseStructuredDraftFromClassify(classifyData));
  }, [classifyData, shouldAutofillCategory, userCategoryOverride]);

  const includedMembers = useMemo((): GroupMemberRosterEntry[] => {
    const set = new Set(includedIds);
    return activeRoster.filter((m) => set.has(m.id));
  }, [activeRoster, includedIds]);

  const currencyResolved = useMemo(() => currency.trim() || 'INR', [currency]);

  const splitFormState = useMemo(
    (): LocalSplitFormState => ({
      splitType,
      participantUserIds: includedIds,
      totalAmountMajor: amountMajorNormalized,
      currency: currencyResolved,
      exactByUserId,
      percentByUserId,
      sharesByUserId,
      adjustFixedByUserId,
      adjustRemainderUserId,
    }),
    [
      adjustFixedByUserId,
      adjustRemainderUserId,
      amountMajorNormalized,
      currencyResolved,
      exactByUserId,
      includedIds,
      percentByUserId,
      sharesByUserId,
      splitType,
    ],
  );

  const submitSnapshot = useMemo(
    () => ({
      title,
      amountMajorNormalized,
      dateYmd,
      paidByUserId,
      includedIds,
      splitForm: splitFormState,
    }),
    [amountMajorNormalized, dateYmd, includedIds, paidByUserId, splitFormState, title],
  );

  const submitBlockerKey = useMemo(
    () => firstAddExpenseSubmitBlocker(submitSnapshot),
    [submitSnapshot],
  );

  const splitPayloadResult = useMemo(
    () => validateLocalSplitForm(splitFormState),
    [splitFormState],
  );

  const amountCardBlocked = submitAttempted && submitBlockerKey === 'expenses.add.validationAmount';
  const titleCardBlocked = submitAttempted && submitBlockerKey === 'expenses.add.validationTitle';
  const peopleCardBlocked =
    submitAttempted && submitBlockerKey === 'expenses.add.validation.payerMustBeOnSplit';
  const splitCardBlocked =
    submitAttempted &&
    submitBlockerKey !== null &&
    !amountCardBlocked &&
    !titleCardBlocked &&
    !peopleCardBlocked;

  const payerName = useMemo(() => {
    const m = activeRoster.find((r) => r.id === paidByUserId);
    if (!m) return '';
    return memberDisplayName(m, me?.id, t);
  }, [activeRoster, me?.id, paidByUserId, t]);

  const payerInitial = useMemo(() => memberInitial(payerName || '?'), [payerName]);

  const payerAvatar = useMemo(
    () => activeRoster.find((r) => r.id === paidByUserId)?.avatar ?? null,
    [activeRoster, paidByUserId],
  );

  const preview = useMemo(
    () =>
      computeParticipantPreview({
        splitType,
        includedMemberIds: includedIds,
        paidByUserId,
        totalAmountMajor: amountMajorNormalized,
        exactByUserId,
        percentByUserId,
        sharesByUserId,
      }),
    [
      amountMajorNormalized,
      exactByUserId,
      includedIds,
      paidByUserId,
      percentByUserId,
      sharesByUserId,
      splitType,
    ],
  );

  const peopleCount = includedMembers.length;
  const peopleCountLabel = t('expenses.add.modern.previewPeopleCount', { count: peopleCount });

  const peopleSectionHeading = t('expenses.add.modern.peopleSectionCount', {
    count: peopleCount,
  });

  const groupTitle = groupQuery.data?.name ?? t('expenses.add.modern.groupFallback');

  const headerTitle = useMemo(
    () => `${t('expenses.add.modern.screenTitle').toUpperCase()} · ${groupTitle.toUpperCase()}`,
    [groupTitle, t],
  );

  const paidByContextLine =
    peopleCount <= 1
      ? t('expenses.add.modern.paidByContextFull')
      : t('expenses.add.modern.paidByContextShared');

  const paidByOnBrightPaper = mode === 'dark';
  const paidByTitleColor = paidByOnBrightPaper ? palette.black : palette.textPrimary;
  const paidBySubtitleColor = paidByOnBrightPaper ? palette.textDisabled : palette.textMuted;
  const paidByAvatarBgColor = paidByOnBrightPaper ? palette.black : palette.textPrimary;
  const paidByInitialColor = paidByOnBrightPaper ? palette.white : palette.textInverse;

  const participantsForRender = useMemo(() => {
    const byId = new Map(activeRoster.map((m) => [m.id, m]));
    return preview.rows.flatMap((row) => {
      const member = byId.get(row.userId);
      if (!member) return [];
      const name = memberDisplayName(member, me?.id, t);
      const initial = memberInitial(member.name?.trim() || member.username?.trim() || row.userId);
      const isMe = member.id === me?.id;
      const isPayerMe = paidByUserId === me?.id;
      let contextLine: string;
      if (row.isPayer) {
        contextLine = isMe
          ? t('expenses.add.modern.participantContextYouPaid')
          : t('expenses.add.modern.participantContextPayerSettled');
      } else if (row.status === 'pending') {
        contextLine = t('expenses.add.modern.participantContextPending');
      } else {
        contextLine = isPayerMe
          ? t('expenses.add.modern.participantContextOwesYou')
          : t('expenses.add.modern.participantContextOwesPayer', { name: payerName });
      }
      return [
        {
          key: row.userId,
          name,
          initial,
          avatarUri: member.avatar ?? null,
          amountMajor: row.amountMajor,
          contextLine,
          status: row.status,
        },
      ];
    });
  }, [activeRoster, me?.id, paidByUserId, payerName, preview.rows, t]);

  const openSplit = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    splitSheetRef.current?.present();
  }, []);

  const openMembers = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    memberSheetRef.current?.present();
  }, []);

  const onSplitSheetSave = useCallback(() => {
    const key = firstSplitSheetDismissBlocker(splitFormState, paidByUserId, includedIds);
    if (key) {
      Alert.alert(t('expenses.add.errorTitle'), t(key));
      return;
    }
    splitSheetRef.current?.dismiss();
  }, [includedIds, paidByUserId, splitFormState, t]);

  const onSubmit = useCallback(() => {
    if (offline || saveMutation.isPending || !isUuid(groupId)) return;
    setSubmitAttempted(true);
    if (submitBlockerKey) {
      Alert.alert(t('expenses.add.errorTitle'), t(submitBlockerKey));
      return;
    }
    if (!splitPayloadResult.ok) {
      Alert.alert(t('expenses.add.errorTitle'), t(splitPayloadResult.messageKey));
      return;
    }
    const d = dateYmd.trim();
    const body = buildCreateExpenseBodyFromForm({
      title,
      amountMajor: amountMajorNormalized,
      paidByUserId,
      date: d,
      currency: currencyResolved,
      notes,
      split: splitPayloadResult.split,
      category: expenseCategory,
      structured: structuredDraft,
    });
    saveMutation.mutate(body, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onClose();
      },
      onError: (err) => {
        const { titleKey, messageKey } = mapExpenseCreateError(err);
        Alert.alert(t(titleKey), t(messageKey));
      },
    });
  }, [
    amountMajorNormalized,
    currencyResolved,
    dateYmd,
    expenseCategory,
    groupId,
    notes,
    offline,
    onClose,
    paidByUserId,
    saveMutation,
    splitPayloadResult,
    structuredDraft,
    submitBlockerKey,
    t,
    title,
  ]);

  if (!isUuid(groupId)) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: space.screenPadding }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.modern.closeA11y')}
            accessibilityHint={t('expenses.add.modern.closeHint')}
            onPress={onClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={palette.textPrimary} />
          </Pressable>
          <Text style={{ marginTop: space.gapLg, color: palette.textSecondary }}>
            {t('expenses.add.validationGroupId')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (rosterQuery.isPending && !didSeed) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (activeRoster.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: space.screenPadding }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.modern.closeA11y')}
            onPress={onClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={palette.textPrimary} />
          </Pressable>
          <Text style={{ marginTop: space.gapLg, color: palette.textSecondary }}>
            {t('expenses.add.validationRoster')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const footerInteractDisabled = offline || saveMutation.isPending;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              alignItems: 'stretch',
              paddingHorizontal: space.screenPadding,
              paddingTop: space.gapMd,
              paddingBottom: space.sectionGapSm,
              gap: space.gapLg,
            }}
          >
            {/* ── HEADER: [X]   NEW EXPENSE · GROUP   INR ⌄ ── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: sz.touchMin,
                marginBottom: space.gapMd,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('expenses.add.modern.closeA11y')}
                accessibilityHint={t('expenses.add.modern.closeHint')}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  onClose();
                }}
                hitSlop={14}
                style={({ pressed }) => ({
                  width: sz.touchMin,
                  height: sz.touchMin,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="close" size={22} color={palette.textPrimary} />
              </Pressable>

              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: space.gap }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={{
                    fontFamily: typography.fontFamily.sans.medium,
                    fontSize: typography.fontSize.xs,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.textPrimary,
                    maxWidth: '100%',
                  }}
                >
                  {headerTitle}
                </Text>
              </View>

              <View
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('expenses.add.modern.dateCurrencyTitle')}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    metaSheetRef.current?.present();
                  }}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: sz.touchMin,
                    minHeight: sz.touchMin,
                    paddingHorizontal: space.gapSm,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.sans.semiBold,
                      fontSize: typography.fontSize.sm,
                      color: palette.textPrimary,
                      marginRight: space.gapXs,
                    }}
                  >
                    {currencyResolved.toUpperCase()}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={palette.iconMuted} />
                </Pressable>
              </View>
            </View>

            {offline ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.gapSm,
                  paddingVertical: space.gapMd,
                  paddingHorizontal: space.gapMd,
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.warningBorder,
                  backgroundColor: palette.warningSubtle,
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={sz.iconSm}
                  color={palette.warningText}
                />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                  accessibilityLiveRegion="polite"
                >
                  {t('expenses.add.offline')}
                </Text>
              </View>
            ) : null}

            {/* ── AMOUNT (flush, no card) ── */}
            <View style={{ gap: space.gap }}>
              <SectionLabel>{t('expenses.add.fieldAmount')}</SectionLabel>
              <AmountHero value={amount} currency={currencyResolved} onChange={setAmount} />
              {amountCardBlocked ? (
                <View style={{ height: 1, backgroundColor: palette.warningText }} />
              ) : null}
            </View>

            {/* ── PAID BY (kicker on canvas; white rounded row) ── */}
            <View style={{ alignSelf: 'stretch', gap: space.gap }}>
              <SectionLabel>{t('expenses.add.modern.paidByKicker')}</SectionLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('expenses.add.modern.paidByKicker')}. ${payerName}. ${t('expenses.add.premium.membersRowHint')}`}
                onPress={openMembers}
                style={({ pressed }) => ({
                  position: 'relative',
                  alignSelf: 'stretch',
                  width: '100%',
                  paddingVertical: space.gapMd,
                  paddingLeft: space.paddingMd,
                  paddingRight: space.paddingMd + sz.iconMd,
                  borderRadius: radius.xl,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: peopleCardBlocked ? palette.warningBorder : palette.border,
                  backgroundColor: palette.white,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.gapMd,
                    alignSelf: 'stretch',
                  }}
                >
                  <View
                    style={{
                      width: sz.avatar,
                      height: sz.avatar,
                      borderRadius: radius.full,
                      backgroundColor: paidByAvatarBgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {payerAvatar ? (
                      <Image
                        source={{ uri: payerAvatar }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.mono.medium,
                          fontSize: typography.fontSize.sm,
                          color: paidByInitialColor,
                        }}
                      >
                        {payerInitial}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: typography.fontFamily.sans.semiBold,
                        fontSize: typography.fontSize.lg,
                        color: paidByTitleColor,
                      }}
                    >
                      {payerName || t('expenses.add.premium.splitParticipantYou')}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: space.gapXs,
                        fontFamily: typography.fontFamily.sans.regular,
                        fontSize: typography.fontSize.xs,
                        color: paidBySubtitleColor,
                      }}
                    >
                      {paidByContextLine}
                    </Text>
                  </View>
                </View>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: space.paddingMd,
                    top: 0,
                    bottom: 0,
                    width: sz.iconMd,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="chevron-forward" size={18} color={palette.iconMuted} />
                </View>
              </Pressable>
            </View>

            <View style={{ alignSelf: 'stretch', gap: space.gapMd }}>
              {/* ── WHAT FOR + NOTE (single card, divider) ── */}
              <View
                style={{
                  alignSelf: 'stretch',
                  borderRadius: radius.xl,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: titleCardBlocked ? palette.warningBorder : palette.border,
                  backgroundColor: palette.white,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  accessible={false}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    titleInputRef.current?.focus();
                  }}
                  android_ripple={Platform.OS === 'android' ? null : undefined}
                  style={({ pressed }) => [
                    { alignSelf: 'stretch' },
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <View
                    style={{
                      paddingHorizontal: space.paddingLg,
                      paddingTop: space.paddingLg,
                      paddingBottom: space.gapMd,
                      gap: space.gap,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.mono.regular,
                        fontSize: typography.fontSize['2xs'],
                        letterSpacing: typography.letterSpacing.widest,
                        textTransform: 'uppercase',
                        color: palette.textMuted,
                      }}
                    >
                      {t('expenses.add.modern.whatForKicker')}
                    </Text>
                    <TextInput
                      ref={titleInputRef}
                      value={title}
                      onChangeText={setTitle}
                      placeholder={t('expenses.add.modern.titlePlaceholderSuggest')}
                      placeholderTextColor={palette.textMuted}
                      selectionColor={palette.accent}
                      cursorColor={palette.accent}
                      accessibilityLabel={t('expenses.add.premium.titleInputA11y')}
                      returnKeyType="done"
                      style={{
                        alignSelf: 'stretch',
                        fontFamily: typography.fontFamily.sans.semiBold,
                        fontSize: typography.fontSize.lg,
                        color: palette.textPrimary,
                        padding: 0,
                        margin: 0,
                        minHeight: 24,
                        includeFontPadding: false,
                      }}
                    />
                  </View>
                </Pressable>

                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    marginHorizontal: space.paddingLg,
                    backgroundColor: palette.borderSubtle,
                  }}
                />

                <Pressable
                  accessible={false}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    noteInputRef.current?.focus();
                  }}
                  android_ripple={Platform.OS === 'android' ? null : undefined}
                  style={({ pressed }) => [
                    { alignSelf: 'stretch' },
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <View
                    style={{
                      paddingHorizontal: space.paddingLg,
                      paddingTop: space.gapMd,
                      paddingBottom: space.paddingLg,
                      gap: space.gap,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.mono.regular,
                        fontSize: typography.fontSize['2xs'],
                        letterSpacing: typography.letterSpacing.widest,
                        textTransform: 'uppercase',
                        color: palette.textMuted,
                      }}
                    >
                      {t('expenses.add.modern.notesKickerOptional')}
                    </Text>
                    <TextInput
                      ref={noteInputRef}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder={t('expenses.add.modern.notesPlaceholder')}
                      placeholderTextColor={palette.textMuted}
                      selectionColor={palette.accent}
                      cursorColor={palette.accent}
                      multiline
                      scrollEnabled={false}
                      accessibilityLabel={t('expenses.add.premium.rowNotes')}
                      style={{
                        alignSelf: 'stretch',
                        fontFamily: typography.fontFamily.sans.regular,
                        fontSize: typography.fontSize.md,
                        lineHeight: typography.fontSize.md * 1.4,
                        color: palette.textPrimary,
                        padding: 0,
                        margin: 0,
                        minHeight: 24,
                        textAlignVertical: 'top',
                        includeFontPadding: false,
                      }}
                    />
                  </View>
                </Pressable>
              </View>

              {/* ── SPLIT ── */}
              <SectionCard
                kicker={t('expenses.add.modern.splitMethodKicker')}
                onPress={openSplit}
                hideChevron
                hasError={splitCardBlocked}
              >
                <SplitPreviewCard
                  splitTypeLabel={splitMainRowTitle(t, splitType)}
                  splitType={splitType}
                  onChangeSplit={openSplit}
                  peopleCountLabel={peopleCountLabel}
                  perPersonMajor={
                    preview.equalPerPersonMajor ??
                    (preview.totalMinor !== null && peopleCount > 0
                      ? (preview.allocatedMinor / 100 / Math.max(peopleCount, 1)).toFixed(2)
                      : null)
                  }
                  currency={currencyResolved}
                  progress={preview.progress}
                  hasError={splitCardBlocked}
                />
              </SectionCard>
            </View>

            {/* ── PEOPLE ── */}
            <View style={{ gap: space.gapMd }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <SectionLabel>{peopleSectionHeading}</SectionLabel>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('expenses.add.modern.peopleSectionEditA11y')}
                  onPress={openMembers}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    minHeight: sz.touchMin,
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.sans.medium,
                      fontSize: typography.fontSize.sm,
                      color: palette.textPrimary,
                    }}
                  >
                    {t('expenses.add.modern.peopleSectionEdit')}
                  </Text>
                </Pressable>
              </View>

              <View style={{ gap: space.gapMd }}>
                {participantsForRender.map((p) => (
                  <ParticipantRow
                    key={p.key}
                    name={p.name}
                    contextLine={p.contextLine}
                    initial={p.initial}
                    avatarUri={p.avatarUri}
                    amountMajor={p.amountMajor}
                    currency={currencyResolved}
                    status={p.status}
                  />
                ))}
              </View>

              <AddPersonButton
                label={t('expenses.add.modern.addPersonCta')}
                onPress={openMembers}
                accessibilityLabel={t('expenses.add.modern.addPersonCtaA11y')}
              />
            </View>
          </ScrollView>

          <View
            pointerEvents="box-none"
            style={{
              flexShrink: 0,
              zIndex: zIndex.sticky,
              elevation: 24,
              paddingHorizontal: space.screenPadding,
              paddingTop: space.gapMd,
              paddingBottom: Math.max(insets.bottom, space.sectionGapSm),
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: palette.border,
              backgroundColor: mode === 'dark' ? palette.surfaceFloating : palette.surfaceBase,
            }}
          >
            <FloatingCTA
              fill="ink"
              label={t('expenses.add.submit')}
              accessibilityLabel={t('expenses.add.submitA11y')}
              disabled={footerInteractDisabled}
              loading={saveMutation.isPending}
              borderRadius={radius.xl}
              onPress={() => onSubmit()}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

      <SplitExpenseSheet
        sheetRef={splitSheetRef}
        splitType={splitType}
        onChangeSplitType={setSplitType}
        includedMembers={includedMembers}
        totalAmountMajor={amountMajorNormalized}
        currency={currencyResolved}
        currentUserId={me?.id}
        paidByUserId={paidByUserId}
        exactByUserId={exactByUserId}
        setExactByUserId={setExactByUserId}
        percentByUserId={percentByUserId}
        setPercentByUserId={setPercentByUserId}
        sharesByUserId={sharesByUserId}
        setSharesByUserId={setSharesByUserId}
        onSave={onSplitSheetSave}
      />

      <MemberPickSheet
        sheetRef={memberSheetRef}
        members={activeRoster}
        includedIds={includedIds}
        onIncludedChange={setIncludedIds}
        paidByUserId={paidByUserId}
        onPaidByChange={setPaidByUserId}
        currentUserId={me?.id}
        onDone={() => memberSheetRef.current?.dismiss()}
      />

      <MetaPickSheet
        sheetRef={metaSheetRef}
        dateYmd={dateYmd}
        onDateChange={setDateYmd}
        currency={currency}
        onCurrencyChange={setCurrency}
        onSave={() => metaSheetRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}
