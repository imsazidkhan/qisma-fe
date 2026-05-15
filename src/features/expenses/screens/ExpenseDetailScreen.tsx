import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton } from '@/components/ui';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { mapExpenseCommentError } from '@/features/expenses/api/expenseCommentsApi';
import { mapExpenseReceiptUploadError } from '@/features/expenses/api/expenseReceiptsApi';
import {
  EXPENSE_COMMENT_CLIENT_CODES,
  validateExpenseCommentMessage,
} from '@/features/expenses/constants/expenseComment';
import { EXPENSE_DETAIL_ERROR_CODES } from '@/features/expenses/constants/errorCodes';
import { useCreateExpenseComment } from '@/features/expenses/hooks/useCreateExpenseComment';
import {
  ExpenseDetailPanels,
  ExpenseDetailThreadComposer,
  type ExpenseDetailPanelId,
} from '@/features/expenses/components/expenseDetail/ExpenseDetailPanels';
import { ExpenseDetailThreadList } from '@/features/expenses/components/expenseDetail/ExpenseDetailThreadList';
import { ExpenseDetailScreenHeader } from '@/features/expenses/components/expenseDetail/ExpenseDetailScreenHeader';
import { ExpenseDetailSegmentTabs } from '@/features/expenses/components/expenseDetail/ExpenseDetailSegmentTabs';
import { useExpenseDetail } from '@/features/expenses/hooks/useExpenseDetail';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import { useUploadExpenseReceipt } from '@/features/expenses/hooks/useUploadExpenseReceipt';
import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import {
  pickExpenseDetailNote,
  pickExpenseDetailPaidBy,
} from '@/features/expenses/utils/expenseDetailHeroMeta';
import { buildExpenseDetailParticipantViews } from '@/features/expenses/utils/expenseDetailParticipantViews';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';
import { resolveExpenseFeedCategoryVisual } from '@/features/expenses/utils/resolveExpenseFeedCategoryVisual';
import { useGroupMemberProfile } from '@/features/groups/hooks/useGroupDetail';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { isUuid } from '@/features/groups/utils/isUuid';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { shareTextNative } from '@/services/shareNative';
import { layoutGrid, spacing, textStyles, useThemeColors } from '@/theme';

export type ExpenseDetailScreenProps = {
  expenseId: string;
  groupId: string;
  onBack: () => void;
};

function isExpenseNotFound(err: unknown): boolean {
  if (!(err instanceof ApiError)) {
    return false;
  }
  return err.code === EXPENSE_DETAIL_ERROR_CODES.EXPENSE_NOT_FOUND || err.status === 404;
}

function pickCreatedAtIso(detail: ExpenseDetail): string | undefined {
  const raw = detail.createdAt;
  return typeof raw === 'string' && raw.trim() !== '' ? raw : undefined;
}

function resolveSplitTypeLabel(
  detail: ExpenseDetail,
  translate: (key: string) => string,
): string | null {
  const d = detail as Record<string, unknown>;
  const raw = typeof d.splitType === 'string' ? d.splitType.trim().toLowerCase() : '';
  if (raw === 'equal') return translate('expenses.add.splitEqual');
  if (raw === 'custom' || raw === 'custom_amount') return translate('expenses.add.splitCustom');
  if (raw === 'percent' || raw === 'percentage') return translate('expenses.add.splitPercent');
  if (raw === 'shares' || raw === 'share') return translate('expenses.add.splitShares');
  if (raw === 'adjust') return translate('expenses.add.splitAdjust');
  if (raw !== '') return raw.replace(/_/g, ' ');
  return null;
}

export function ExpenseDetailScreen({
  expenseId,
  groupId,
  onBack,
}: ExpenseDetailScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const idOk = expenseId.trim().length > 0;
  const query = useExpenseDetail(idOk ? groupId : undefined, idOk ? expenseId : undefined, {
    enabled: idOk,
  });
  const [panel, setPanel] = useState<ExpenseDetailPanelId>('overview');
  const [commentDraft, setCommentDraft] = useState('');
  /** Bumped after a successful thread post so the list can reliably scrollToEnd once new rows layout. */
  const [threadScrollToEndSignal, setThreadScrollToEndSignal] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [overviewPullRefreshing, setOverviewPullRefreshing] = useState(false);

  useEffect(() => {
    setPanel('overview');
  }, [groupId, expenseId]);

  const commentMutation = useCreateExpenseComment(groupId, expenseId);
  const receiptMutation = useUploadExpenseReceipt(groupId, expenseId);

  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const groupProfile = useGroupMemberProfile(idOk ? groupId : undefined);
  const { data: me } = useAuthMe();
  const meId = me?.id?.trim() ?? '';
  const rosterQuery = useGroupMembers(idOk ? groupId : undefined, {
    enabled: Boolean(idOk && isUuid(groupId.trim())),
  });
  const rosterDenied =
    rosterQuery.isError &&
    rosterQuery.error instanceof ApiError &&
    rosterQuery.error.code === 'NOT_GROUP_MEMBER';

  const showEditButton = useMemo(() => {
    if (rosterDenied) return false;
    const roster = rosterQuery.data;
    if (!roster) return true;
    if (meId === '') return true;
    return roster.some((m) => m.id === meId && m.status === 'active');
  }, [meId, rosterDenied, rosterQuery.data]);

  const { isOnline, isReady: netReady } = useNetworkStatus();
  const actionsDisabled = netReady && !isOnline;

  const groupTitle = groupProfile.data?.name?.trim() ?? '';
  const groupSubtitleLoading =
    !groupProfile.isError && groupProfile.data === undefined && groupProfile.isFetching;

  const headerSummaryA11y = useMemo(() => {
    const d = query.data;
    if (!d) return '';
    const titlePart = d.title.trim() || '—';
    const amountPart = formatExpenseMajorAmount(d.amount, d.currency);
    let groupPart = '';
    if (groupSubtitleLoading) {
      groupPart = t('expenses.detail.headerGroupLoadingA11y');
    } else if (groupTitle !== '') {
      groupPart = t('expenses.detail.headerGroupNamedA11y', { name: groupTitle });
    }
    const parts = [titlePart, amountPart];
    if (groupPart !== '') parts.push(groupPart);
    return parts.join('. ');
  }, [groupSubtitleLoading, groupTitle, query.data, t]);

  const handleEditExpense = useCallback(() => {
    if (!idOk) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(
      `/home/group/${encodeURIComponent(groupId)}/expense/${encodeURIComponent(expenseId)}/edit`,
    );
  }, [expenseId, groupId, idOk]);

  const handleShareExpense = useCallback(() => {
    const d = query.data;
    if (!d) return;
    void Haptics.selectionAsync().catch(() => {});
    const amt = formatExpenseMajorAmount(d.amount, d.currency);
    const gt = groupProfile.data?.name?.trim() ?? '';
    const lines = [d.title.trim(), amt, gt !== '' ? gt : undefined].filter(Boolean);
    void shareTextNative(lines.join('\n'), t('expenses.detail.shareDialogTitle'));
  }, [groupProfile.data, query.data, t]);

  const participantViews = useMemo(() => {
    const d = query.data;
    if (!d) return [];
    return buildExpenseDetailParticipantViews(d, d.paidByUserId);
  }, [query.data]);

  const splitTypeLabel = useMemo(() => {
    const d = query.data;
    if (!d) return null;
    return resolveSplitTypeLabel(d, (key: string) => t(key));
  }, [query.data, t]);

  const onOpenUrl = useCallback(
    async (url: string): Promise<void> => {
      const ok = await Linking.canOpenURL(url).catch(() => false);
      if (!ok) {
        Alert.alert(
          t('expenses.receiptsUpload.errorTitle'),
          t('expenses.receiptsUpload.errorGeneric'),
        );
        return;
      }
      await Linking.openURL(url);
    },
    [t],
  );

  const sendComment = useCallback(() => {
    const v = validateExpenseCommentMessage(commentDraft);
    if (!v.ok) {
      const msg =
        v.code === EXPENSE_COMMENT_CLIENT_CODES.EMPTY
          ? t('expenses.comments.validationEmpty')
          : t('expenses.comments.validationTooLong');
      Alert.alert(t('expenses.comments.errorTitle'), msg);
      return;
    }
    commentMutation.mutate(
      { message: v.message },
      {
        onSuccess: () => {
          setCommentDraft('');
          setThreadScrollToEndSignal((n) => n + 1);
        },
        onError: (err) => {
          const p = parseExpenseCommentApiError(err);
          if (p.kind === 'forbidden') {
            Alert.alert(t('expenses.comments.errorTitle'), t('expenses.comments.forbiddenModify'));
            return;
          }
          if (p.kind === 'invalid_parent') {
            Alert.alert(t('expenses.comments.errorTitle'), t('expenses.comments.invalidParent'));
            return;
          }
          if (p.kind === 'validation') {
            Alert.alert(
              t('expenses.comments.errorTitle'),
              p.details?.[0] ?? t('expenses.comments.validationGeneric'),
            );
            return;
          }
          if (p.kind === 'expense_not_found') {
            void queryClient.invalidateQueries({
              queryKey: expensesQueryKeys.detail(groupId, expenseId),
            });
            Alert.alert(t('expenses.detail.notFoundTitle'), t('expenses.detail.notFoundBody'));
            return;
          }
          const mapped = mapExpenseCommentError(err);
          Alert.alert(t(mapped.titleKey), t(mapped.messageKey));
        },
      },
    );
  }, [commentDraft, commentMutation, groupId, expenseId, queryClient, t]);

  const pickAndUploadReceipt = useCallback(async () => {
    void Haptics.selectionAsync().catch(() => {});
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setUploadProgress(0);
    receiptMutation.mutate(
      {
        file: {
          uri: a.uri,
          mimeType: a.mimeType ?? 'image/jpeg',
          fileName: a.fileName ?? 'receipt.jpg',
          fileSizeBytes: a.fileSize ?? undefined,
        },
        onProgress: (r) => setUploadProgress(r),
      },
      {
        onSettled: () => setUploadProgress(null),
        onError: (err) => {
          const { titleKey, messageKey } = mapExpenseReceiptUploadError(err);
          Alert.alert(t(titleKey), t(messageKey));
        },
      },
    );
  }, [receiptMutation, t]);

  if (!idOk) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('expenses.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <ActivityIndicator color={palette.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError && isExpenseNotFound(query.error)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('expenses.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('expenses.detail.loadErrorTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.detail.loadErrorBody')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.detail.retryA11y')}
            onPress={() => void query.refetch()}
          >
            <Text style={[textStyles.label, { color: palette.accent }]}>
              {t('expenses.detail.retry')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const detailLoaded = query.data;
  if (detailLoaded !== undefined && detailLoaded.groupId.trim() !== groupId.trim()) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('expenses.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const detail = detailLoaded;
  if (detail === undefined) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.asyncShell}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <ActivityIndicator color={palette.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const amountLabel = formatExpenseMajorAmount(detail.amount, detail.currency);
  const createdIso = pickCreatedAtIso(detail);
  const categoryVisual = resolveExpenseFeedCategoryVisual(
    detail as unknown as GroupExpenseFeedItem,
  );
  const paidSnippet = pickExpenseDetailPaidBy(detail);
  const payerFallback = participantViews.find(
    (p) => p.userId.trim().toLowerCase() === detail.paidByUserId.trim().toLowerCase(),
  );
  const paidByName =
    paidSnippet.name.trim() ||
    (payerFallback?.name ?? '').trim() ||
    t('expenses.detail.memberFallback');
  const paidByAvatarUrl = paidSnippet.avatarUrl ?? payerFallback?.avatarUrl ?? null;
  const notesLine = pickExpenseDetailNote(detail);

  const tabs = [
    {
      id: 'overview' as const,
      label: t('expenses.detail.panelOverview'),
      a11yLabel: t('expenses.detail.tabOverviewA11y'),
    },
    {
      id: 'thread' as const,
      label: t('expenses.detail.panelThread'),
      a11yLabel: t('expenses.detail.tabThreadA11y'),
    },
    {
      id: 'files' as const,
      label: t('expenses.detail.panelFiles'),
      a11yLabel: t('expenses.detail.tabFilesA11y'),
    },
    {
      id: 'history' as const,
      label: t('expenses.detail.panelHistory'),
      a11yLabel: t('expenses.detail.tabHistoryA11y'),
    },
  ];

  const uploadPct =
    uploadProgress === null ? null : Math.round(Math.min(1, Math.max(0, uploadProgress)) * 100);

  const isThread = panel === 'thread';

  const renderExpenseDetailHeaderBlock = (surfaceColor: string): ReactElement => (
    <View
      style={{
        gap: layoutGrid.section,
        backgroundColor: surfaceColor,
        paddingBottom: layoutGrid.sm,
      }}
    >
      <ExpenseDetailScreenHeader
        actionsDisabled={actionsDisabled}
        backA11y={t('common.backA11y')}
        categoryVisual={categoryVisual}
        editA11y={t('expenses.detail.editCtaA11y')}
        groupSubtitleLoading={groupSubtitleLoading}
        groupTitle={groupTitle}
        headerSummaryA11y={headerSummaryA11y}
        offlineActionHint={t('expenses.detail.offlineActionHint')}
        shareA11y={t('expenses.detail.shareA11y')}
        showEditButton={showEditButton}
        title={detail.title}
        titleMuted={panel === 'thread'}
        onBack={onBack}
        onEdit={handleEditExpense}
        onShare={handleShareExpense}
      />

      <ExpenseDetailSegmentTabs active={panel} tabs={tabs} onChange={setPanel} />
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safe,
        {
          backgroundColor:
            panel === 'thread' ? palette.expenseDetailThreadCanvas : palette.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={[
          styles.safe,
          {
            backgroundColor:
              panel === 'thread' ? palette.expenseDetailThreadCanvas : palette.background,
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={layoutGrid.inset}
      >
        <View style={{ flex: 1, position: 'relative' }}>
          <View
            style={[
              styles.safe,
              { flex: 1, zIndex: isThread ? 0 : 1 },
              isThread && [
                StyleSheet.absoluteFillObject,
                { opacity: 0, pointerEvents: 'none' as const },
              ],
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              stickyHeaderIndices={[0]}
              refreshControl={
                <RefreshControl
                  colors={[palette.textSecondary]}
                  refreshing={overviewPullRefreshing}
                  tintColor={palette.textSecondary}
                  onRefresh={() => {
                    setOverviewPullRefreshing(true);
                    void refetch().finally(() => {
                      setOverviewPullRefreshing(false);
                    });
                  }}
                />
              }
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              {renderExpenseDetailHeaderBlock(palette.background)}
              <ExpenseDetailPanels
                amountLabel={amountLabel}
                commentDraft={commentDraft}
                commentMutation={commentMutation}
                detail={detail}
                notesLine={notesLine}
                onCommentDraftChange={setCommentDraft}
                onOpenAttachmentUrl={(url) => void onOpenUrl(url)}
                onPickReceipt={() => void pickAndUploadReceipt()}
                onSendComment={sendComment}
                paidByAvatarUrl={paidByAvatarUrl}
                paidByName={paidByName}
                panel={panel}
                participantViews={participantViews}
                receiptMutation={receiptMutation}
                recordedAtIso={createdIso}
                splitTypeLabel={splitTypeLabel}
                uploadPct={uploadPct}
              />
            </ScrollView>
          </View>

          <View
            style={[
              styles.safe,
              { flex: 1, zIndex: isThread ? 1 : 0 },
              !isThread && [
                StyleSheet.absoluteFillObject,
                { opacity: 0, pointerEvents: 'none' as const },
              ],
            ]}
          >
            <View
              style={{
                flexShrink: 0,
                paddingTop: layoutGrid.sm,
                paddingHorizontal: layoutGrid.inset,
              }}
            >
              {renderExpenseDetailHeaderBlock(palette.expenseDetailThreadCanvas)}
            </View>
            <ExpenseDetailThreadList
              expenseId={expenseId}
              fetchEnabled={isThread}
              groupId={groupId}
              scrollToEndSignal={threadScrollToEndSignal}
            />
            <View
              style={[
                styles.threadComposerStickyOuter,
                {
                  backgroundColor: palette.expenseDetailThreadCanvas,
                  borderTopColor: palette.threadComposerBorder,
                  paddingHorizontal: spacing['4'],
                  paddingTop: spacing['3'],
                  paddingBottom: Math.max(insets.bottom + spacing['2.5'], spacing['3']),
                },
              ]}
            >
              <ExpenseDetailThreadComposer
                commentDraft={commentDraft}
                commentMutation={commentMutation}
                onCommentDraftChange={setCommentDraft}
                onSendComment={sendComment}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
