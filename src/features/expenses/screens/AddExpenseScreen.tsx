import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { mapExpenseCreateError, mapExpensePatchError } from '@/features/expenses/api/expensesApi';
import { EXPENSE_DETAIL_ERROR_CODES } from '@/features/expenses/constants/errorCodes';
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

import { useExpenseDetail } from '@/features/expenses/hooks/useExpenseDetail';
import { useExpenseSplitState } from '@/features/expenses/hooks/useExpenseSplitState';
import { useExpenseTitleClassify } from '@/features/expenses/hooks/useExpenseTitleClassify';
import { useExpenseWrite } from '@/features/expenses/hooks/useExpenseWrite';
import {
  EXPENSE_SPLIT_TYPES,
  type ExpenseSplitType,
} from '@/features/expenses/types/expense.types';
import {
  expenseStructuredDraftFromClassify,
  type ExpenseStructuredDraft,
} from '@/features/expenses/types/expenseTaxonomy.types';
import { firstAddExpenseSubmitBlocker } from '@/features/expenses/utils/addExpenseSubmitReadiness';
import { parseAmountToMinor } from '@/features/expenses/utils/amountParsing';
import { buildCreateExpenseBodyFromForm } from '@/features/expenses/utils/buildCreateExpenseBodyFromForm';
import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';
import { buildExpensePatchFromForm } from '@/features/expenses/utils/buildExpensePatchFromForm';
import { assertExpensePatchIncludesSplitWhenRequired } from '@/features/expenses/utils/expensePatchRules';
import { expenseStructuredPatchSnapshotFromWire } from '@/features/expenses/utils/expenseStructuredPatch';
import { buildHydratedSplitSeed } from '@/features/expenses/utils/hydrateSplitSeedFromExpenseDetail';
import { participantIdsFromExpenseDetail } from '@/features/expenses/utils/participantIdsFromExpenseDetail';
import { readExpenseStructuredWire } from '@/features/expenses/utils/readExpenseStructuredWire';
import { seedSplitMapsForTabTransition } from '@/features/expenses/utils/splitTabTransitionSeed';
import { computeParticipantPreview } from '@/features/expenses/utils/computeParticipantPreview';
import {
  validateLocalSplitForm,
  type LocalSplitFormState,
} from '@/features/expenses/utils/localExpenseSplit';
import { useGroupBalancesSnapshot } from '@/features/groups/hooks/useGroupBalancesSnapshot';
import { useGroupMemberProfile } from '@/features/groups/hooks/useGroupDetail';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { storage } from '@/services/storage';
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
  /** When set, loads the expense and PATCHes on save (same UI as add). */
  editExpenseId?: string;
};

function isExpenseNotFound(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return err.code === EXPENSE_DETAIL_ERROR_CODES.EXPENSE_NOT_FOUND || err.status === 404;
}

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

const INLINE_SUBMIT_HINTS: Record<string, string> = {
  'expenses.add.validationTitle': 'expenses.add.modern.submitHintMissingTitle',
  'expenses.add.validationAmount': 'expenses.add.modern.submitHintMissingAmount',
  'expenses.add.validationDate': 'expenses.add.modern.submitHintMissingDate',
  'expenses.add.validation.payerMustBeOnSplit': 'expenses.add.modern.submitHintMissingPayer',
};

type SubmitScrollAnchor = 'date' | 'amount' | 'paidBy' | 'title' | 'split';

function parseStoredSplitType(raw: string | undefined): ExpenseSplitType | null {
  if (!raw) return null;
  return (EXPENSE_SPLIT_TYPES as readonly string[]).includes(raw) ? (raw as ExpenseSplitType) : null;
}

function submitBlockerScrollAnchor(blockerKey: string): SubmitScrollAnchor {
  switch (blockerKey) {
    case 'expenses.add.validationTitle':
      return 'title';
    case 'expenses.add.validationAmount':
      return 'amount';
    case 'expenses.add.validationDate':
      return 'date';
    case 'expenses.add.validation.payerMustBeOnSplit':
      return 'paidBy';
    default:
      return 'split';
  }
}

export function AddExpenseScreen({
  groupId,
  onClose,
  editExpenseId,
}: AddExpenseScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const insets = useSafeAreaInsets();
  const { data: me } = useAuthMe();
  const groupQuery = useGroupMemberProfile(isUuid(groupId) ? groupId : undefined);
  const rosterQuery = useGroupMembers(groupId, { enabled: isUuid(groupId) });
  const roster = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);

  const editId = editExpenseId?.trim() ?? '';
  const isEdit = editId.length > 0;

  const balancesSnapshotQuery = useGroupBalancesSnapshot(isUuid(groupId) ? groupId : undefined, {
    enabled: isUuid(groupId) && !isEdit,
  });
  const ledgerCurrency = useMemo(() => {
    const c = balancesSnapshotQuery.data?.summary.currency?.trim().toUpperCase();
    return c && c.length === 3 ? c : null;
  }, [balancesSnapshotQuery.data?.summary.currency]);

  const detailQuery = useExpenseDetail(isEdit ? groupId : undefined, isEdit ? editId : undefined, {
    enabled: isEdit && isUuid(groupId) && isUuid(editId),
  });
  const detail = detailQuery.data;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [dateYmd, setDateYmd] = useState(() => ymdFromDate(new Date()));
  const [paidByUserId, setPaidByUserId] = useState('');
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [didSeed, setDidSeed] = useState(false);
  const [structuredDraft, setStructuredDraft] = useState<ExpenseStructuredDraft | null>(null);
  const [userCategoryOverride, setUserCategoryOverride] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [editHydrated, setEditHydrated] = useState(false);

  const currencyUserPickedRef = useRef(false);
  const setCurrencyFromSheet = useCallback((code: string) => {
    currencyUserPickedRef.current = true;
    setCurrency(code);
  }, []);

  const classifyHook = useExpenseTitleClassify(title);
  const classifyQuery = classifyHook.classifyQuery;
  const showTitleClassifyChecking = classifyHook.showTitleClassifyChecking;
  const classifyData = classifyQuery.data;
  const classifyMeta = classifyData?.classification;
  const titleReadyForClassify = title.trim().length >= 3;
  const shouldAutofillCategory =
    titleReadyForClassify &&
    classifyMeta?.isFallback !== true &&
    classifyMeta?.shouldPromptCorrection === false &&
    Boolean(classifyData?.category);

  const initialSplitFromPrefs = useMemo((): ExpenseSplitType | undefined => {
    if (isEdit) return undefined;
    return parseStoredSplitType(storage.getString(STORAGE_KEYS.expenseLastSplitType)) ?? undefined;
  }, [isEdit]);

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
  } = useExpenseSplitState(includedIds, { initialSplitType: initialSplitFromPrefs });

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

  const onChangeSplitTypeWithSync = useCallback(
    (next: ExpenseSplitType) => {
      if (next === splitType) return;
      const totalSanitized = amountMajorNormalized;
      const equalParts = computeEqualMajorPerPerson(totalSanitized, includedIds.length);
      const seed = seedSplitMapsForTabTransition(
        splitType,
        next,
        includedIds,
        totalSanitized,
        equalParts,
        exactByUserId,
        percentByUserId,
        sharesByUserId,
      );
      if (seed.exactByUserId) setExactByUserId(seed.exactByUserId);
      if (seed.percentByUserId) setPercentByUserId(seed.percentByUserId);
      if (seed.sharesByUserId) setSharesByUserId(seed.sharesByUserId);
      setSplitType(next);
    },
    [
      amountMajorNormalized,
      exactByUserId,
      includedIds,
      percentByUserId,
      sharesByUserId,
      setExactByUserId,
      setPercentByUserId,
      setSharesByUserId,
      setSplitType,
      splitType,
    ],
  );

  useEffect(() => {
    if (isEdit || currencyUserPickedRef.current) return;
    if (!ledgerCurrency) return;
    setCurrency(ledgerCurrency);
  }, [isEdit, ledgerCurrency]);

  const writeTarget = useMemo(
    () =>
      isEdit
        ? { mode: 'edit' as const, groupId, expenseId: editId }
        : { mode: 'create' as const, groupId },
    [editId, groupId, isEdit],
  );
  const saveMutation = useExpenseWrite(writeTarget);
  const { isOnline, isReady } = useNetworkStatus();
  const offline = isReady && !isOnline;

  const splitSheetRef = useRef<BottomSheetModal | null>(null);
  const memberSheetRef = useRef<BottomSheetModal | null>(null);
  const metaSheetRef = useRef<BottomSheetModal | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);
  const noteInputRef = useRef<TextInput | null>(null);
  const amountInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollAnchorYRef = useRef<Partial<Record<SubmitScrollAnchor, number>>>({});

  const activeRoster = useMemo(() => roster.filter((r) => r.status === 'active'), [roster]);
  const activeRosterIds = useMemo(() => activeRoster.map((r) => r.id), [activeRoster]);

  const editPatchBaseline = useMemo(
    () =>
      detail && isEdit
        ? { amount: detail.amount, paidByUserId: detail.paidByUserId }
        : { amount: '', paidByUserId: '' },
    [detail, isEdit],
  );

  useEffect(() => {
    if (isEdit) {
      setDidSeed(true);
      return;
    }
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
  }, [activeRosterIds, didSeed, isEdit, me?.id, rosterQuery.isPending]);

  useEffect(() => {
    if (isEdit) return;
    storage.set(STORAGE_KEYS.expenseLastSplitType, splitType);
  }, [isEdit, splitType]);

  useEffect(() => {
    if (!isEdit) {
      setEditHydrated(false);
      return;
    }
    if (!detail?.id) {
      setEditHydrated(false);
      return;
    }
    setEditHydrated(false);
    setTitle(detail.title);
    setAmount(detail.amount.replace(/,/g, ''));
    setCurrency(detail.currency);
    setDateYmd(detail.date);
    const n = (detail as { notes?: unknown }).notes;
    setNotes(typeof n === 'string' ? n : '');
    setPaidByUserId(detail.paidByUserId);
    setIncludedIds(participantIdsFromExpenseDetail(detail));
    const wire = readExpenseStructuredWire(detail);
    setStructuredDraft({ merchantId: wire.merchantId ?? undefined });

    const tid = setTimeout(() => {
      const seed = buildHydratedSplitSeed(detail);
      setSplitType(seed.splitType);
      setExactByUserId((prev) => ({ ...prev, ...seed.exactByUserId }));
      setPercentByUserId((prev) => ({ ...prev, ...seed.percentByUserId }));
      setSharesByUserId((prev) => ({ ...prev, ...seed.sharesByUserId }));
      setEditHydrated(true);
    }, 0);
    return () => {
      clearTimeout(tid);
    };
  }, [detail, isEdit, setExactByUserId, setPercentByUserId, setSharesByUserId, setSplitType]);

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
    if (isEdit && !editHydrated) return;
    if (classifyQuery.isFetching) return;
    setStructuredDraft(expenseStructuredDraftFromClassify(classifyData));
  }, [
    classifyData,
    classifyQuery.isFetching,
    editHydrated,
    isEdit,
    shouldAutofillCategory,
    userCategoryOverride,
  ]);

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

  const activeSubmitHintKey = useMemo(() => {
    if (!submitBlockerKey) return null;
    return INLINE_SUBMIT_HINTS[submitBlockerKey] ?? submitBlockerKey;
  }, [submitBlockerKey]);

  const splitPayloadResult = useMemo(
    () => validateLocalSplitForm(splitFormState),
    [splitFormState],
  );

  const amountCardBlocked = submitAttempted && submitBlockerKey === 'expenses.add.validationAmount';
  const titleCardBlocked = submitAttempted && submitBlockerKey === 'expenses.add.validationTitle';
  const dateCardBlocked = submitAttempted && submitBlockerKey === 'expenses.add.validationDate';
  const peopleCardBlocked =
    submitAttempted && submitBlockerKey === 'expenses.add.validation.payerMustBeOnSplit';
  const splitCardBlocked =
    submitAttempted &&
    submitBlockerKey !== null &&
    !amountCardBlocked &&
    !titleCardBlocked &&
    !peopleCardBlocked;

  const amountFieldA11yHint = useMemo(() => {
    if (amountCardBlocked && activeSubmitHintKey) return t(activeSubmitHintKey);
    return t('expenses.add.modern.amountFieldHint');
  }, [activeSubmitHintKey, amountCardBlocked, t]);

  const titleFieldA11yHint = useMemo(() => {
    if (titleCardBlocked && activeSubmitHintKey) return t(activeSubmitHintKey);
    return t('expenses.add.modern.titleFieldHintNext');
  }, [activeSubmitHintKey, titleCardBlocked, t]);

  const paidByFieldA11yHint = useMemo(() => {
    if (peopleCardBlocked && activeSubmitHintKey) return t(activeSubmitHintKey);
    return t('expenses.add.premium.membersRowHint');
  }, [activeSubmitHintKey, peopleCardBlocked, t]);

  const dateCurrencyFieldA11yHint = useMemo(() => {
    if (dateCardBlocked && activeSubmitHintKey) return t(activeSubmitHintKey);
    return t('expenses.add.modern.dateCurrencyFieldHint');
  }, [activeSubmitHintKey, dateCardBlocked, t]);

  const splitSectionA11yHint = useMemo(() => {
    if (splitCardBlocked && activeSubmitHintKey) return t(activeSubmitHintKey);
    return t('expenses.add.modern.splitFieldHint');
  }, [activeSubmitHintKey, splitCardBlocked, t]);

  const submitCtaAccessibilityLabel = useMemo(() => {
    if (saveMutation.isPending) {
      return isEdit
        ? `${t('expenses.edit.submitting')}. ${t('expenses.edit.submittingSubtitle')}`
        : `${t('expenses.add.submitting')}. ${t('expenses.add.submittingSubtitle')}`;
    }
    return isEdit ? t('expenses.edit.ctaA11y') : t('expenses.add.submitA11y');
  }, [isEdit, saveMutation.isPending, t]);

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

  const headerTitle = useMemo(() => {
    const screenKey = isEdit
      ? 'expenses.add.modern.editScreenTitle'
      : 'expenses.add.modern.screenTitle';
    return `${t(screenKey).toUpperCase()} · ${groupTitle.toUpperCase()}`;
  }, [groupTitle, isEdit, t]);

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

  const captureScrollAnchor = useCallback((anchor: SubmitScrollAnchor) => {
    return (e: LayoutChangeEvent) => {
      scrollAnchorYRef.current[anchor] = e.nativeEvent.layout.y;
    };
  }, []);

  const revealSubmitBlocker = useCallback((blockerKey: string) => {
    const anchor = submitBlockerScrollAnchor(blockerKey);
    const y = scrollAnchorYRef.current[anchor];
    void InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        if (y != null && scrollRef.current) {
          scrollRef.current.scrollTo({ y: Math.max(0, y - space.gapMd), animated: true });
        }
        setTimeout(() => {
          if (blockerKey === 'expenses.add.validationTitle') {
            titleInputRef.current?.focus();
          } else if (blockerKey === 'expenses.add.validationAmount') {
            amountInputRef.current?.focus();
          } else if (blockerKey === 'expenses.add.validationDate') {
            metaSheetRef.current?.present();
          } else if (blockerKey === 'expenses.add.validation.payerMustBeOnSplit') {
            memberSheetRef.current?.present();
          } else {
            splitSheetRef.current?.present();
          }
        }, 360);
      });
    });
  }, []);

  const openSplit = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    splitSheetRef.current?.present();
  }, []);

  const openMembers = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    memberSheetRef.current?.present();
  }, []);

  const onSubmit = useCallback(() => {
    if (offline || saveMutation.isPending || !isUuid(groupId)) return;
    setSubmitAttempted(true);
    if (submitBlockerKey) {
      const hintKey = activeSubmitHintKey ?? submitBlockerKey;
      void AccessibilityInfo.announceForAccessibility(t(hintKey));
      revealSubmitBlocker(submitBlockerKey);
      return;
    }
    if (!splitPayloadResult.ok) {
      void AccessibilityInfo.announceForAccessibility(t(splitPayloadResult.messageKey));
      revealSubmitBlocker(splitPayloadResult.messageKey);
      return;
    }
    const d = dateYmd.trim();

    if (isEdit) {
      if (!detail) return;
      if (!includedIds.includes(paidByUserId)) {
        void AccessibilityInfo.announceForAccessibility(
          `${t('expenses.edit.errorTitle')}. ${t('expenses.add.validation.pickParticipants')}`,
        );
        revealSubmitBlocker('expenses.add.validation.payerMustBeOnSplit');
        return;
      }
      const wireSnap = readExpenseStructuredWire(detail);
      const patch = buildExpensePatchFromForm({
        detail,
        title,
        amountMajor: amountMajorNormalized,
        paidByUserId,
        date: d,
        currency: currencyResolved,
        notes,
        split: splitPayloadResult.split,
        structuredBaseline: expenseStructuredPatchSnapshotFromWire(wireSnap),
        structuredDraft: {
          merchantId: structuredDraft?.merchantId ?? wireSnap.merchantId ?? null,
        },
      });
      try {
        assertExpensePatchIncludesSplitWhenRequired(patch, editPatchBaseline);
      } catch {
        void AccessibilityInfo.announceForAccessibility(t('expenses.edit.errorSplitFinancial'));
        revealSubmitBlocker('expenses.add.validation.splitMismatch');
        Alert.alert(t('expenses.edit.errorTitle'), t('expenses.edit.errorSplitFinancial'));
        return;
      }
      saveMutation.mutate(patch, {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onClose();
        },
        onError: (err) => {
          const mapped = mapExpensePatchError(err);
          void AccessibilityInfo.announceForAccessibility(
            `${t(mapped.titleKey)}. ${t(mapped.messageKey)}`,
          );
          Alert.alert(t(mapped.titleKey), t(mapped.messageKey));
        },
      });
      return;
    }

    const body = buildCreateExpenseBodyFromForm({
      title,
      amountMajor: amountMajorNormalized,
      paidByUserId,
      date: d,
      currency: currencyResolved,
      notes,
      split: splitPayloadResult.split,
      structured: structuredDraft,
    });
    saveMutation.mutate(body, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onClose();
      },
      onError: (err) => {
        const mapped = mapExpenseCreateError(err);
        const detailMessage = mapped.messagePlain ?? t(mapped.messageKey);
        void AccessibilityInfo.announceForAccessibility(`${t(mapped.titleKey)}. ${detailMessage}`);
        Alert.alert(t(mapped.titleKey), detailMessage);
      },
    });
  }, [
    activeSubmitHintKey,
    amountMajorNormalized,
    currencyResolved,
    dateYmd,
    detail,
    editPatchBaseline,
    groupId,
    includedIds,
    isEdit,
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
    revealSubmitBlocker,
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

  if (isEdit) {
    if (!isUuid(editId)) {
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
              {t('expenses.detail.notFoundBody')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    if (detailQuery.isPending || rosterQuery.isPending || !editHydrated) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
          <View style={{ padding: space.screenPadding, flex: 1 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('expenses.add.modern.closeA11y')}
              onPress={onClose}
              hitSlop={12}
            >
              <Ionicons name="close" size={26} color={palette.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={palette.accent} />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    if (detailQuery.isError && isExpenseNotFound(detailQuery.error)) {
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
              {t('expenses.detail.notFoundBody')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    if (detailQuery.isError || !detail) {
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
              {t('expenses.edit.loadError')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    if (detail.groupId.trim() !== groupId.trim()) {
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
              {t('expenses.detail.notFoundBody')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }
  }

  if (!isEdit && rosterQuery.isPending && !didSeed) {
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
            ref={scrollRef}
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
              onLayout={captureScrollAnchor('date')}
              style={{ gap: space.gapXs, marginBottom: space.gapMd }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: sz.touchMin,
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
                    accessibilityHint={dateCurrencyFieldA11yHint}
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
                      borderRadius: radius.sm,
                      borderWidth: dateCardBlocked ? StyleSheet.hairlineWidth : 0,
                      borderColor: dateCardBlocked ? palette.warningBorder : 'transparent',
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

              {dateCardBlocked && activeSubmitHintKey ? (
                <Text
                  accessibilityRole="text"
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                >
                  {t(activeSubmitHintKey)}
                </Text>
              ) : null}

              {!isEdit && ledgerCurrency !== null && currencyResolved !== ledgerCurrency ? (
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.textMuted,
                  }}
                >
                  {t('expenses.add.modern.currencyMismatchMono', {
                    expense: currencyResolved.toUpperCase(),
                    ledger: ledgerCurrency,
                  })}
                </Text>
              ) : null}
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
            <View onLayout={captureScrollAnchor('amount')} style={{ gap: space.gap }}>
              <SectionLabel>{t('expenses.add.fieldAmount')}</SectionLabel>
              <AmountHero
                accessibilityHint={amountFieldA11yHint}
                inputRef={amountInputRef}
                value={amount}
                currency={currencyResolved}
                onChange={setAmount}
              />
              {amountCardBlocked && activeSubmitHintKey ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                >
                  {t(activeSubmitHintKey)}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.textMuted,
                  }}
                >
                  {t('expenses.add.modern.amountEntryFormatMono')}
                </Text>
              )}
            </View>

            {/* ── PAID BY (kicker on canvas; white rounded row) ── */}
            <View onLayout={captureScrollAnchor('paidBy')} style={{ alignSelf: 'stretch', gap: space.gap }}>
              <SectionLabel>{t('expenses.add.modern.paidByKicker')}</SectionLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('expenses.add.modern.paidByKicker')}. ${payerName}`}
                accessibilityHint={paidByFieldA11yHint}
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
              {peopleCardBlocked && activeSubmitHintKey ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                >
                  {t(activeSubmitHintKey)}
                </Text>
              ) : null}
            </View>

            <View style={{ alignSelf: 'stretch', gap: space.gapMd }}>
              {/* ── WHAT FOR + NOTE (single card, divider) ── */}
              <View onLayout={captureScrollAnchor('title')} style={{ gap: space.gapMd }}>
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
                      accessibilityHint={titleFieldA11yHint}
                      blurOnSubmit={false}
                      returnKeyType="next"
                      onSubmitEditing={() => noteInputRef.current?.focus()}
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
                    {showTitleClassifyChecking ? (
                      <Text
                        accessibilityRole="text"
                        accessibilityLiveRegion="polite"
                        style={{
                          fontFamily: typography.fontFamily.mono.regular,
                          fontSize: typography.fontSize['2xs'],
                          letterSpacing: typography.letterSpacing.widest,
                          textTransform: 'uppercase',
                          color: palette.textMuted,
                        }}
                      >
                        {t('expenses.add.modern.classifyCheckingMono')}
                      </Text>
                    ) : null}
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
                      accessibilityHint={t('expenses.add.modern.notesFieldHint')}
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

              {titleCardBlocked && activeSubmitHintKey ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                >
                  {t(activeSubmitHintKey)}
                </Text>
              ) : null}
              </View>

              {/* ── SPLIT ── */}
              <View onLayout={captureScrollAnchor('split')} style={{ gap: space.gapMd }}>
              <SectionCard
                kicker={t('expenses.add.modern.splitMethodKicker')}
                accessibilityLabel={t('expenses.add.modern.splitSectionA11y')}
                accessibilityHint={splitSectionA11yHint}
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

              {splitCardBlocked && activeSubmitHintKey ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                    color: palette.warningText,
                  }}
                >
                  {t(activeSubmitHintKey)}
                </Text>
              ) : null}
            </View>
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
              label={
                isEdit
                  ? saveMutation.isPending
                    ? t('expenses.edit.submitting')
                    : t('expenses.edit.cta')
                  : saveMutation.isPending
                    ? t('expenses.add.submitting')
                    : t('expenses.add.submit')
              }
              subtitle={
                saveMutation.isPending
                  ? isEdit
                    ? t('expenses.edit.submittingSubtitle')
                    : t('expenses.add.submittingSubtitle')
                  : undefined
              }
              accessibilityLabel={submitCtaAccessibilityLabel}
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
        onChangeSplitType={onChangeSplitTypeWithSync}
        includedMembers={includedMembers}
        totalAmountMajor={amountMajorNormalized}
        onChangeTotalAmountMajor={setAmount}
        currency={currencyResolved}
        currentUserId={me?.id}
        paidByUserId={paidByUserId}
        exactByUserId={exactByUserId}
        setExactByUserId={setExactByUserId}
        percentByUserId={percentByUserId}
        setPercentByUserId={setPercentByUserId}
        sharesByUserId={sharesByUserId}
        setSharesByUserId={setSharesByUserId}
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
        onCurrencyChange={setCurrencyFromSheet}
        onSave={() => metaSheetRef.current?.dismiss()}
        dominantCurrencyCode={ledgerCurrency}
      />
    </SafeAreaView>
  );
}
