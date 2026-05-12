import * as Haptics from 'expo-haptics';
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button, Input } from '@/components/ui';
import { ExpenseClassifySuggestionBlock } from '@/features/expenses/components/addExpense/ExpenseClassifySuggestionBlock';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { mapExpenseCreateError, mapExpensePatchError } from '@/features/expenses/api/expensesApi';
import { EXPENSE_DETAIL_ERROR_CODES } from '@/features/expenses/constants/errorCodes';
import { useExpenseDetail } from '@/features/expenses/hooks/useExpenseDetail';
import { useExpenseSplitState } from '@/features/expenses/hooks/useExpenseSplitState';
import { useExpenseWrite } from '@/features/expenses/hooks/useExpenseWrite';
import {
  EXPENSE_SPLIT_TYPES,
  type ExpenseSplitType,
} from '@/features/expenses/types/expense.types';
import { buildCreateExpenseBodyFromForm } from '@/features/expenses/utils/buildCreateExpenseBodyFromForm';
import { buildExpensePatchFromForm } from '@/features/expenses/utils/buildExpensePatchFromForm';
import {
  expenseStructuredPatchSnapshotFromClassify,
  expenseStructuredPatchSnapshotFromWire,
  type ExpenseStructuredPatchSnapshot,
} from '@/features/expenses/utils/expenseStructuredPatch';
import { readExpenseStructuredWire } from '@/features/expenses/utils/readExpenseStructuredWire';
import { assertExpensePatchIncludesSplitWhenRequired } from '@/features/expenses/utils/expensePatchRules';
import { validateLocalSplitForm } from '@/features/expenses/utils/localExpenseSplit';
import { participantIdsFromExpenseDetail } from '@/features/expenses/utils/participantIdsFromExpenseDetail';
import { sanitizeAmountTyping } from '@/features/expenses/utils/amountParsing';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { isUuid } from '@/features/groups/utils/isUuid';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { platformShadow, radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type EditExpenseScreenProps = {
  expenseId: string;
  groupId: string;
  onBack: () => void;
  /** When true, opens empty form and POSTs a new expense; `expenseId` is ignored. */
  createMode?: boolean;
};

const SPLIT_LABEL_KEYS: Record<ExpenseSplitType, string> = {
  equal: 'expenses.add.splitEqual',
  exact: 'expenses.add.splitCustom',
  percentage: 'expenses.add.splitPercent',
  shares: 'expenses.add.splitShares',
  adjust: 'expenses.add.splitAdjust',
};

function isExpenseNotFound(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return err.code === EXPENSE_DETAIL_ERROR_CODES.EXPENSE_NOT_FOUND || err.status === 404;
}

export function EditExpenseScreen({
  expenseId,
  groupId,
  onBack,
  createMode = false,
}: EditExpenseScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { data: me } = useAuthMe();
  const idOk = createMode || isUuid(expenseId);
  const expenseIdForQuery = createMode ? undefined : isUuid(expenseId) ? expenseId : undefined;
  const query = useExpenseDetail(expenseIdForQuery, { enabled: Boolean(expenseIdForQuery) });
  const rosterQuery = useGroupMembers(groupId, { enabled: isUuid(groupId) });
  const roster = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [dateYmd, setDateYmd] = useState('');
  const [notes, setNotes] = useState('');
  const [paidByUserId, setPaidByUserId] = useState('');
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [didHydrate, setDidHydrate] = useState(false);
  const [didSeedCreate, setDidSeedCreate] = useState(false);
  const [structuredOverride, setStructuredOverride] =
    useState<ExpenseStructuredPatchSnapshot | null>(null);

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
    setAdjustFixedByUserId,
    adjustRemainderUserId,
    setAdjustRemainderUserId,
  } = useExpenseSplitState(includedIds);

  const writeTarget = useMemo(
    () =>
      createMode
        ? { mode: 'create' as const, groupId }
        : { mode: 'edit' as const, groupId, expenseId },
    [createMode, expenseId, groupId],
  );
  const saveMutation = useExpenseWrite(writeTarget);
  const { isOnline, isReady } = useNetworkStatus();
  const offline = isReady && !isOnline;

  const detail = query.data;
  const groupMismatch = !createMode && detail !== undefined && detail.groupId !== groupId;

  useEffect(() => {
    if (createMode) {
      return;
    }
    if (!detail?.id) {
      return;
    }
    setStructuredOverride(null);
  }, [createMode, detail?.id]);

  useEffect(() => {
    if (createMode) return;
    if (!detail) return;
    setDidHydrate(false);
    setTitle(detail.title);
    setAmount(detail.amount.replace(/,/g, ''));
    setCurrency(detail.currency);
    setDateYmd(detail.date);
    const n = (detail as { notes?: unknown }).notes;
    setNotes(typeof n === 'string' ? n : '');
    setPaidByUserId(detail.paidByUserId);
    setIncludedIds(participantIdsFromExpenseDetail(detail));
  }, [createMode, detail]);

  useEffect(() => {
    if (createMode || !detail || didHydrate) return;
    if (includedIds.length === 0) {
      setDidHydrate(true);
      return;
    }
    const seedExact: Record<string, string> = {};
    for (const row of detail.participants) {
      const id =
        typeof row['userId'] === 'string'
          ? row['userId']
          : typeof row['id'] === 'string'
            ? row['id']
            : null;
      if (!id) continue;
      const raw =
        typeof row['amount'] === 'string'
          ? row['amount']
          : typeof row['share'] === 'string'
            ? row['share']
            : '';
      if (raw) seedExact[id] = raw.replace(/,/g, '');
    }
    if (Object.keys(seedExact).length > 0) {
      setExactByUserId((prev) => ({ ...prev, ...seedExact }));
    }
    setDidHydrate(true);
  }, [createMode, detail, didHydrate, includedIds.length, setExactByUserId]);

  const activeRosterIds = useMemo(
    () => roster.filter((r) => r.status === 'active').map((r) => r.id),
    [roster],
  );

  useEffect(() => {
    if (!createMode || didSeedCreate) return;
    if (rosterQuery.isPending) return;
    setIncludedIds([...activeRosterIds]);
    if (activeRosterIds.length > 0) {
      if (me?.id && activeRosterIds.includes(me.id)) {
        setPaidByUserId(me.id);
      } else {
        setPaidByUserId(activeRosterIds[0] ?? '');
      }
    }
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setDateYmd(`${y}-${m}-${d}`);
    setCurrency('INR');
    setDidSeedCreate(true);
    setDidHydrate(true);
  }, [activeRosterIds, createMode, didSeedCreate, me?.id, rosterQuery.isPending]);

  const baseline = useMemo(
    () =>
      detail
        ? { amount: detail.amount, paidByUserId: detail.paidByUserId }
        : { amount: '', paidByUserId: '' },
    [detail],
  );

  const toggleIncluded = useCallback((id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setIncludedIds((cur) => {
      if (cur.includes(id)) {
        const next = cur.filter((x) => x !== id);
        return next.length === 0 ? [id] : next;
      }
      return [...cur, id];
    });
  }, []);

  const onSubmit = useCallback(() => {
    if (!didHydrate || saveMutation.isPending || offline) return;

    if (createMode) {
      if (!isUuid(groupId)) {
        Alert.alert(t('expenses.add.errorTitle'), t('expenses.add.validationGroupId'));
        return;
      }
      if (!title.trim()) {
        Alert.alert(t('expenses.add.errorTitle'), t('expenses.add.validationTitle'));
        return;
      }
      const normalizedAmount = amount.trim().replace(/,/g, '');
      if (!normalizedAmount || Number(normalizedAmount) <= 0) {
        Alert.alert(t('expenses.add.errorTitle'), t('expenses.add.validationAmount'));
        return;
      }
      const d = dateYmd.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        Alert.alert(t('expenses.add.errorTitle'), t('expenses.add.validationDate'));
        return;
      }
      if (!includedIds.includes(paidByUserId)) {
        Alert.alert(t('expenses.add.errorTitle'), t('expenses.add.validation.pickParticipants'));
        return;
      }
      const cur = currency.trim() || 'INR';
      const splitResult = validateLocalSplitForm({
        splitType: splitType,
        participantUserIds: includedIds,
        totalAmountMajor: normalizedAmount,
        currency: cur,
        exactByUserId: exactByUserId,
        percentByUserId: percentByUserId,
        sharesByUserId: sharesByUserId,
        adjustFixedByUserId: adjustFixedByUserId,
        adjustRemainderUserId: adjustRemainderUserId,
      });
      if (!splitResult.ok) {
        Alert.alert(t('expenses.add.errorTitle'), t(splitResult.messageKey));
        return;
      }
      const body = buildCreateExpenseBodyFromForm({
        title,
        amountMajor: normalizedAmount,
        paidByUserId,
        date: d,
        currency: cur,
        notes,
        split: splitResult.split,
      });
      saveMutation.mutate(body, {
        onSuccess: () => {
          onBack();
        },
        onError: (err) => {
          const { titleKey, messageKey } = mapExpenseCreateError(err);
          Alert.alert(t(titleKey), t(messageKey));
        },
      });
      return;
    }

    if (!detail) return;
    if (!includedIds.includes(paidByUserId)) {
      Alert.alert(t('expenses.edit.errorTitle'), t('expenses.add.validation.pickParticipants'));
      return;
    }
    const normalizedAmount = amount.trim().replace(/,/g, '');
    const splitResult = validateLocalSplitForm({
      splitType: splitType,
      participantUserIds: includedIds,
      totalAmountMajor: normalizedAmount,
      currency: currency.trim() || detail.currency,
      exactByUserId: exactByUserId,
      percentByUserId: percentByUserId,
      sharesByUserId: sharesByUserId,
      adjustFixedByUserId: adjustFixedByUserId,
      adjustRemainderUserId: adjustRemainderUserId,
    });
    if (!splitResult.ok) {
      Alert.alert(t('expenses.edit.errorTitle'), t(splitResult.messageKey));
      return;
    }
    const patch = buildExpensePatchFromForm({
      detail,
      title,
      amountMajor: normalizedAmount,
      paidByUserId,
      date: dateYmd.trim(),
      currency: currency.trim() || detail.currency,
      notes,
      split: splitResult.split,
      ...(structuredOverride !== null
        ? {
            structuredBaseline: expenseStructuredPatchSnapshotFromWire(
              readExpenseStructuredWire(detail),
            ),
            structuredDraft: structuredOverride,
          }
        : {}),
    });
    try {
      assertExpensePatchIncludesSplitWhenRequired(patch, baseline);
    } catch {
      Alert.alert(t('expenses.edit.errorTitle'), t('expenses.edit.errorSplitFinancial'));
      return;
    }
    saveMutation.mutate(patch, {
      onSuccess: () => {
        onBack();
      },
      onError: (err) => {
        const { titleKey, messageKey } = mapExpensePatchError(err);
        Alert.alert(t(titleKey), t(messageKey));
      },
    });
  }, [
    amount,
    baseline,
    createMode,
    currency,
    dateYmd,
    detail,
    didHydrate,
    exactByUserId,
    groupId,
    includedIds,
    notes,
    offline,
    paidByUserId,
    percentByUserId,
    saveMutation,
    adjustFixedByUserId,
    adjustRemainderUserId,
    sharesByUserId,
    splitType,
    structuredOverride,
    t,
    title,
    onBack,
  ]);

  const groupOk = isUuid(groupId);

  if (!groupOk) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: space.screenPadding }}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('expenses.add.validationGroupId')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!idOk) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: space.screenPadding }}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
        </View>
      </SafeAreaView>
    );
  }

  if (createMode) {
    if (rosterQuery.isPending || !didHydrate) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <ActivityIndicator color={palette.accent} />
          </View>
        </SafeAreaView>
      );
    }
    if (rosterQuery.isError) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <Text style={[textStyles.body, { color: palette.textSecondary }]}>
              {t('groups.membersScreen.loadError')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }
  }

  if (!createMode) {
    if (query.isPending || !didHydrate) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <ActivityIndicator color={palette.accent} />
          </View>
        </SafeAreaView>
      );
    }

    if (query.isError && isExpenseNotFound(query.error)) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <Text style={[textStyles.body, { color: palette.textSecondary }]}>
              {t('expenses.detail.notFoundBody')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    if (query.isError || !detail) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <Text style={[textStyles.body, { color: palette.textSecondary }]}>
              {t('expenses.edit.loadError')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }
  }

  const activeRoster = roster.filter((r) => r.status === 'active');

  if (createMode && activeRoster.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: space.screenPadding, gap: space.gapMd }}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.add.validationRoster')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const headingTitle = createMode ? t('expenses.add.title') : t('expenses.edit.title');
  const headingSubtitle = createMode ? t('expenses.add.subtitle') : t('expenses.edit.subtitle');
  const submitLabel = createMode
    ? saveMutation.isPending
      ? t('expenses.add.submitting')
      : t('expenses.add.submit')
    : saveMutation.isPending
      ? t('expenses.edit.submitting')
      : t('expenses.edit.submit');
  const submitA11y = createMode ? t('expenses.add.submitA11y') : t('expenses.edit.submitA11y');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? space.gapLg : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screenPadding,
            paddingVertical: space.gapMd,
            paddingBottom: space.sectionGapLg,
            gap: space.gapMd,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>

          <Text style={[textStyles.h3, { color: palette.textPrimary }]}>{headingTitle}</Text>
          <Text style={[textStyles.captionSmall, { color: palette.textSecondary }]}>
            {headingSubtitle}
          </Text>

          {!createMode && groupMismatch ? (
            <Text style={[textStyles.captionSmall, { color: palette.warningText }]}>
              {t('expenses.detail.groupMismatch')}
            </Text>
          ) : null}

          {offline ? (
            <Text style={[textStyles.captionSmall, { color: palette.warningText }]}>
              {t('expenses.add.offline')}
            </Text>
          ) : null}

          <View
            style={{
              gap: space.gapMd,
              padding: space.gapMd,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.surfaceElevated,
              ...platformShadow('sm'),
            }}
          >
            <Input label={t('expenses.add.fieldTitle')} value={title} onChangeText={setTitle} />
            <Input
              label={t('expenses.add.fieldAmount')}
              value={amount}
              onChangeText={(v) => setAmount(sanitizeAmountTyping(v))}
              keyboardType="decimal-pad"
            />
            <Input
              label={t('expenses.add.fieldCurrency')}
              value={currency}
              onChangeText={setCurrency}
            />
            <Input label={t('expenses.add.fieldDate')} value={dateYmd} onChangeText={setDateYmd} />
            <Input label={t('expenses.add.fieldNotes')} value={notes} onChangeText={setNotes} />

            {!createMode && title.trim().length >= 2 ? (
              <View style={{ gap: space.gapSm }}>
                <ExpenseClassifySuggestionBlock
                  title={title}
                  onApply={(data) => {
                    setStructuredOverride(expenseStructuredPatchSnapshotFromClassify(data));
                  }}
                />
                {structuredOverride !== null ? (
                  <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                    {t('expenses.add.structuredQueuedHint')}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
              }}
            >
              {t('expenses.add.payerLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
              {activeRoster.map((m) => {
                const label = m.name ?? m.username ?? m.id.slice(0, 8);
                const selected = paidByUserId === m.id;
                return (
                  <Pressable
                    key={`pay-${m.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setPaidByUserId(m.id);
                    }}
                    style={{
                      paddingVertical: space.gapSm,
                      paddingHorizontal: space.gapMd,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected ? palette.accent : palette.borderSubtle,
                      backgroundColor: selected ? palette.accentSoft : palette.surfaceFloating,
                    }}
                  >
                    <Text style={[textStyles.captionSmall, { color: palette.textPrimary }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                marginTop: space.gapMd,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
              }}
            >
              {t('expenses.add.splitWithLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
              {activeRoster.map((m) => {
                const label = m.name ?? m.username ?? m.id.slice(0, 8);
                const on = includedIds.includes(m.id);
                return (
                  <Pressable
                    key={`in-${m.id}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => toggleIncluded(m.id)}
                    style={{
                      paddingVertical: space.gapSm,
                      paddingHorizontal: space.gapMd,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: on ? palette.accent : palette.borderSubtle,
                      backgroundColor: on ? palette.accentSoft : palette.surfaceFloating,
                    }}
                  >
                    <Text style={[textStyles.captionSmall, { color: palette.textPrimary }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textMuted,
                marginTop: space.gapMd,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
              }}
            >
              {t('expenses.add.splitTypeLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
              {EXPENSE_SPLIT_TYPES.map((st) => {
                const active = splitType === st;
                return (
                  <Pressable
                    key={st}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setSplitType(st)}
                    style={{
                      paddingVertical: space.gapSm,
                      paddingHorizontal: space.gapMd,
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: active ? palette.accent : palette.borderSubtle,
                      backgroundColor: active ? palette.accentSoft : palette.surfaceElevated,
                    }}
                  >
                    <Text style={[textStyles.captionSmall, { color: palette.textPrimary }]}>
                      {t(SPLIT_LABEL_KEYS[st])}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {splitType === 'exact' ? (
              <View style={{ gap: space.gapSm }}>
                {includedIds.map((id) => {
                  const m = activeRoster.find((r) => r.id === id);
                  const person = m?.name ?? m?.username ?? id.slice(0, 8);
                  return (
                    <View key={`ex-${id}`} style={{ gap: space.gapXs }}>
                      <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                        {person}
                      </Text>
                      <TextInput
                        value={exactByUserId[id] ?? ''}
                        onChangeText={(tx) =>
                          setExactByUserId((p) => ({ ...p, [id]: sanitizeAmountTyping(tx) }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={palette.textMuted}
                        style={{
                          borderWidth: 1,
                          borderColor: palette.borderSubtle,
                          borderRadius: radius.md,
                          padding: space.gapMd,
                          color: palette.textPrimary,
                          fontFamily: typography.fontFamily.mono.medium,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            {splitType === 'percentage' ? (
              <View style={{ gap: space.gapSm }}>
                {includedIds.map((id) => {
                  const m = activeRoster.find((r) => r.id === id);
                  const person = m?.name ?? m?.username ?? id.slice(0, 8);
                  return (
                    <View key={`pc-${id}`} style={{ gap: space.gapXs }}>
                      <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                        {person}
                      </Text>
                      <TextInput
                        value={percentByUserId[id] ?? ''}
                        onChangeText={(tx) =>
                          setPercentByUserId((p) => ({ ...p, [id]: tx.replace(/[^\d.]/g, '') }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={palette.textMuted}
                        style={{
                          borderWidth: 1,
                          borderColor: palette.borderSubtle,
                          borderRadius: radius.md,
                          padding: space.gapMd,
                          color: palette.textPrimary,
                          fontFamily: typography.fontFamily.mono.medium,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            {splitType === 'shares' ? (
              <View style={{ gap: space.gapSm }}>
                {includedIds.map((id) => {
                  const m = activeRoster.find((r) => r.id === id);
                  const person = m?.name ?? m?.username ?? id.slice(0, 8);
                  return (
                    <View
                      key={`sh-${id}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapMd }}
                    >
                      <Text style={{ flex: 1, color: palette.textSecondary }}>{person}</Text>
                      <TextInput
                        value={String(sharesByUserId[id] ?? 1)}
                        onChangeText={(tx) => {
                          const n = Number(tx.replace(/\D/g, ''));
                          setSharesByUserId((p) => ({
                            ...p,
                            [id]: Number.isFinite(n) && n > 0 ? n : 1,
                          }));
                        }}
                        keyboardType="number-pad"
                        style={{
                          width: 64,
                          borderWidth: 1,
                          borderColor: palette.borderSubtle,
                          borderRadius: radius.md,
                          padding: space.gapSm,
                          color: palette.textPrimary,
                          textAlign: 'center',
                          fontFamily: typography.fontFamily.mono.medium,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            {splitType === 'adjust' ? (
              <View style={{ gap: space.gapMd }}>
                <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                  {t('expenses.add.adjustRemainderLabel')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
                  {includedIds.map((id) => {
                    const m = activeRoster.find((r) => r.id === id);
                    const label = m?.name ?? m?.username ?? id.slice(0, 8);
                    const sel = adjustRemainderUserId === id;
                    return (
                      <Pressable
                        key={`rem-${id}`}
                        onPress={() => setAdjustRemainderUserId(id)}
                        style={{
                          paddingVertical: space.gapSm,
                          paddingHorizontal: space.gapMd,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: sel ? palette.accent : palette.borderSubtle,
                          backgroundColor: sel ? palette.accentSoft : palette.surfaceFloating,
                        }}
                      >
                        <Text style={[textStyles.captionSmall, { color: palette.textPrimary }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {includedIds.map((id) => {
                  if (id === adjustRemainderUserId) return null;
                  const m = activeRoster.find((r) => r.id === id);
                  const person = m?.name ?? m?.username ?? id.slice(0, 8);
                  return (
                    <View key={`adj-${id}`} style={{ gap: space.gapXs }}>
                      <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                        {person}
                      </Text>
                      <TextInput
                        value={adjustFixedByUserId[id] ?? ''}
                        onChangeText={(tx) =>
                          setAdjustFixedByUserId((p) => ({
                            ...p,
                            [id]: sanitizeAmountTyping(tx),
                          }))
                        }
                        keyboardType="decimal-pad"
                        style={{
                          borderWidth: 1,
                          borderColor: palette.borderSubtle,
                          borderRadius: radius.md,
                          padding: space.gapMd,
                          color: palette.textPrimary,
                          fontFamily: typography.fontFamily.mono.medium,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Button
              label={submitLabel}
              variant="accent"
              onPress={onSubmit}
              disabled={saveMutation.isPending || offline}
              loading={saveMutation.isPending}
              trailing="none"
              labelCase="none"
              accessibilityLabel={submitA11y}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
