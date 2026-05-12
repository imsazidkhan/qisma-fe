import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { mapExpenseCommentError } from '@/features/expenses/api/expenseCommentsApi';
import { mapExpenseReactionError } from '@/features/expenses/api/expenseReactionsApi';
import { mapExpenseReceiptUploadError } from '@/features/expenses/api/expenseReceiptsApi';
import {
  EXPENSE_COMMENT_CLIENT_CODES,
  EXPENSE_COMMENT_MESSAGE_MAX_LENGTH,
  validateExpenseCommentMessage,
} from '@/features/expenses/constants/expenseComment';
import { EXPENSE_DETAIL_ERROR_CODES } from '@/features/expenses/constants/errorCodes';
import { useAddExpenseComment } from '@/features/expenses/hooks/useAddExpenseComment';
import { useAddExpenseReaction } from '@/features/expenses/hooks/useAddExpenseReaction';
import { useExpenseDetail } from '@/features/expenses/hooks/useExpenseDetail';
import { useUploadExpenseReceipt } from '@/features/expenses/hooks/useUploadExpenseReceipt';
import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import {
  expenseDetailAuthorSnippet,
  expenseDetailBodyText,
  expenseDetailHistoryLine,
  expenseDetailTitleLine,
} from '@/features/expenses/utils/expenseDetailDisplay';
import { primaryTaxonomyLabel } from '@/features/expenses/utils/readExpenseStructuredWire';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { formatGroupTimestamp } from '@/features/groups/utils/formatGroupTimestamp';
import { isUuid } from '@/features/groups/utils/isUuid';
import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type ExpenseDetailScreenProps = {
  expenseId: string;
  groupId: string;
  onBack: () => void;
};

type DetailPanel = 'overview' | 'thread' | 'files' | 'history';

const QUICK_REACTIONS = ['👍', '❤️', '😂'] as const;

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

function dedupeReactions(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    const uid = typeof row['userId'] === 'string' ? row['userId'] : '';
    const emoji =
      typeof row['emoji'] === 'string'
        ? row['emoji']
        : typeof row['title'] === 'string'
          ? row['title']
          : '';
    const key = `${uid}\0${emoji}`;
    if (!emoji) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function pickAttachmentUrl(row: Record<string, unknown>): string | null {
  const u =
    typeof row['url'] === 'string'
      ? row['url']
      : typeof row['uri'] === 'string'
        ? row['uri']
        : null;
  if (u && u.trim() !== '') return u;
  return null;
}

export function ExpenseDetailScreen({
  expenseId,
  groupId,
  onBack,
}: ExpenseDetailScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const idOk = isUuid(expenseId);
  const query = useExpenseDetail(idOk ? expenseId : undefined, { enabled: idOk });
  const [panel, setPanel] = useState<DetailPanel>('overview');
  const [commentDraft, setCommentDraft] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const commentMutation = useAddExpenseComment(expenseId);
  const reactionMutation = useAddExpenseReaction(expenseId);
  const receiptMutation = useUploadExpenseReceipt(expenseId);

  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const groupMismatch =
    query.data !== undefined && query.data.groupId !== groupId ? query.data.groupId : null;

  const dedupedReactions = useMemo(
    () => (query.data ? dedupeReactions(query.data.reactions) : []),
    [query.data],
  );

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

  const renderLooseRows = (
    rows: Record<string, unknown>[],
    emptyKey: string,
    renderPrimary: (row: Record<string, unknown>) => string | undefined,
    renderSecondary?: (row: Record<string, unknown>) => string | undefined,
  ): ReactElement => {
    if (rows.length === 0) {
      return (
        <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>{t(emptyKey)}</Text>
      );
    }
    return (
      <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
        {rows.map((row, index) => {
          const primary = renderPrimary(row);
          const secondary = renderSecondary?.(row);
          const key = `${index}-${primary ?? 'row'}`;
          return (
            <View
              key={key}
              style={[
                styles.cardRow,
                { borderColor: palette.groupHubBorder, backgroundColor: palette.groupHubCard },
              ]}
            >
              {primary ? (
                <Text style={[textStyles.body, { color: palette.textPrimary }]}>{primary}</Text>
              ) : null}
              {secondary ? (
                <Text style={[styles.monoMeta, { color: palette.groupHubMuted }]}>{secondary}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

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
        },
        onError: (err) => {
          const { titleKey, messageKey } = mapExpenseCommentError(err);
          Alert.alert(t(titleKey), t(messageKey));
        },
      },
    );
  }, [commentDraft, commentMutation, t]);

  const addReaction = useCallback(
    (emoji: string) => {
      void Haptics.selectionAsync().catch(() => {});
      reactionMutation.mutate(
        { emoji },
        {
          onError: (err) => {
            const { titleKey, messageKey } = mapExpenseReactionError(err);
            Alert.alert(t(titleKey), t(messageKey));
          },
        },
      );
    },
    [reactionMutation, t],
  );

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
        <View style={{ paddingHorizontal: space.screenPadding, flex: 1, gap: space.sectionGap }}>
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
        <View style={{ paddingHorizontal: space.screenPadding, flex: 1, gap: space.sectionGap }}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
          </View>
          <ActivityIndicator color={palette.accent} style={{ marginTop: space.sectionGap }} />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError && isExpenseNotFound(query.error)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={{ paddingHorizontal: space.screenPadding, flex: 1, gap: space.sectionGap }}>
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
        <View style={{ paddingHorizontal: space.screenPadding, flex: 1, gap: space.sectionGap }}>
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
            <Text style={[textStyles.label, { color: palette.groupHubAccent }]}>
              {t('expenses.detail.retry')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const detail = query.data;
  const amountLabel = formatExpenseMajorAmount(detail.amount, detail.currency);
  const createdIso = pickCreatedAtIso(detail);
  const whenCreated = createdIso ? formatGroupTimestamp(createdIso, t) : null;

  const panels: { id: DetailPanel; label: string }[] = [
    { id: 'overview', label: t('expenses.detail.panelOverview') },
    { id: 'thread', label: t('expenses.detail.panelThread') },
    { id: 'files', label: t('expenses.detail.panelFiles') },
    { id: 'history', label: t('expenses.detail.panelHistory') },
  ];

  const uploadPct =
    uploadProgress === null ? null : Math.round(Math.min(1, Math.max(0, uploadProgress)) * 100);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={space.gapLg}
      >
        <ScrollView
          contentContainerStyle={[styles.body, { paddingHorizontal: space.screenPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topRow, { justifyContent: 'space-between', gap: space.gapMd }]}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('expenses.detail.editCtaA11y')}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                router.push(
                  `/home/group/${encodeURIComponent(groupId)}/expense/${encodeURIComponent(expenseId)}/edit`,
                );
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[textStyles.label, { color: palette.groupHubAccent }]}>
                {t('expenses.detail.editCta')}
              </Text>
            </Pressable>
          </View>

          {groupMismatch ? (
            <Text
              style={[textStyles.captionSmall, { color: palette.warningText }]}
              accessibilityLiveRegion="polite"
            >
              {t('expenses.detail.groupMismatch')}
            </Text>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.gapSm, paddingVertical: space.gapXs }}
          >
            {panels.map((p) => {
              const active = panel === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPanel(p.id)}
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
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {panel === 'overview' ? (
            <>
              <View
                style={[
                  styles.heroBlock,
                  { borderColor: palette.groupHubBorder, backgroundColor: palette.groupHubCard },
                ]}
              >
                <Text
                  style={[textStyles.h3, { color: palette.textPrimary }]}
                  accessibilityRole="header"
                >
                  {detail.title}
                </Text>
                <Text
                  style={[textStyles.bodyLarge, { color: palette.textPrimary, fontWeight: '600' }]}
                >
                  {amountLabel}
                </Text>
                <Text style={[styles.monoMeta, { color: palette.groupHubMuted }]}>
                  {t('expenses.detail.expenseDate', { date: detail.date })}
                </Text>
                {whenCreated ? (
                  <Text style={[styles.monoMeta, { color: palette.groupHubMuted }]}>
                    {whenCreated}
                  </Text>
                ) : null}
                <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                  {t('expenses.detail.paidByLine', { id: detail.paidByUserId })}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                  {t('expenses.detail.classificationSection')}
                </Text>
                {(() => {
                  const d = detail as Record<string, unknown>;
                  const taxonomy = primaryTaxonomyLabel(detail);
                  const recurring = d.recurringDetected === true;
                  const userClass = d.isUserClassified === true;
                  const conf =
                    typeof d.classificationConfidence === 'string'
                      ? d.classificationConfidence.trim()
                      : '';
                  const src =
                    typeof d.classificationSource === 'string' ? d.classificationSource.trim() : '';
                  if (
                    !taxonomy &&
                    !recurring &&
                    !conf &&
                    !src &&
                    d.isUserClassified === undefined
                  ) {
                    return (
                      <Text style={[textStyles.captionSmall, { color: palette.textSecondary }]}>
                        {t('expenses.detail.classificationEmpty')}
                      </Text>
                    );
                  }
                  return (
                    <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
                      {taxonomy ? (
                        <Text style={[textStyles.body, { color: palette.textPrimary }]}>
                          {taxonomy}
                        </Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
                        <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                          {userClass
                            ? t('expenses.detail.userTagged')
                            : t('expenses.detail.autoTagged')}
                        </Text>
                        {recurring ? (
                          <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                            {t('expenses.detail.recurringBadge')}
                          </Text>
                        ) : null}
                      </View>
                      {conf ? (
                        <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                          {t('expenses.detail.confidenceLine', { value: conf })}
                        </Text>
                      ) : null}
                      {src ? (
                        <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                          {t('expenses.detail.sourceLine', { value: src })}
                        </Text>
                      ) : null}
                    </View>
                  );
                })()}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                  {t('expenses.detail.participantsSection')}
                </Text>
                {renderLooseRows(
                  detail.participants,
                  'expenses.detail.emptyParticipants',
                  (row) =>
                    typeof row['userId'] === 'string'
                      ? t('expenses.detail.participantUser', { id: row['userId'] })
                      : typeof row['id'] === 'string'
                        ? t('expenses.detail.participantUser', { id: row['id'] })
                        : undefined,
                  (row) => {
                    const share =
                      typeof row['share'] === 'string'
                        ? row['share']
                        : typeof row['amount'] === 'string'
                          ? row['amount']
                          : undefined;
                    return share;
                  },
                )}
              </View>
            </>
          ) : null}

          {panel === 'thread' ? (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                  {t('expenses.detail.reactionsSection')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.gapSm }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      accessibilityRole="button"
                      accessibilityLabel={t('expenses.detail.reactionPickA11y', { emoji })}
                      disabled={reactionMutation.isPending}
                      onPress={() => addReaction(emoji)}
                      style={{
                        paddingVertical: space.gapSm,
                        paddingHorizontal: space.gapMd,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: palette.borderSubtle,
                        backgroundColor: palette.groupHubCard,
                      }}
                    >
                      <Text style={{ fontSize: typography.fontSize.xl }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
                {renderLooseRows(
                  dedupedReactions,
                  'expenses.detail.emptyReactions',
                  (row) => expenseDetailTitleLine(row) ?? expenseDetailHistoryLine(row),
                  (row) =>
                    expenseDetailAuthorSnippet(row['user'] ?? row['author']) ??
                    (typeof row['userId'] === 'string' ? row['userId'] : undefined),
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                  {t('expenses.detail.commentsSection')}
                </Text>
                {renderLooseRows(
                  detail.comments,
                  'expenses.detail.emptyComments',
                  (row) => {
                    const body = expenseDetailBodyText(row);
                    if (body) {
                      return body;
                    }
                    return expenseDetailTitleLine(row);
                  },
                  (row) => {
                    const author = row.author;
                    const snippet = expenseDetailAuthorSnippet(author);
                    if (snippet) {
                      return t('expenses.detail.commentAuthor', { name: snippet });
                    }
                    if (typeof row['userId'] === 'string') {
                      return t('expenses.detail.commentAuthorId', { id: row['userId'] });
                    }
                    return typeof row['createdAt'] === 'string'
                      ? formatGroupTimestamp(row['createdAt'], t)
                      : undefined;
                  },
                )}
              </View>

              <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
                <TextInput
                  value={commentDraft}
                  onChangeText={(tx) =>
                    setCommentDraft(tx.slice(0, EXPENSE_COMMENT_MESSAGE_MAX_LENGTH))
                  }
                  placeholder={t('expenses.detail.commentPlaceholder')}
                  placeholderTextColor={palette.textMuted}
                  multiline
                  accessibilityLabel={t('expenses.detail.commentPlaceholder')}
                  style={{
                    minHeight: 88,
                    borderWidth: 1,
                    borderColor: palette.borderSubtle,
                    borderRadius: radius.md,
                    padding: space.gapMd,
                    color: palette.textPrimary,
                    fontFamily: typography.fontFamily.sans.regular,
                    textAlignVertical: 'top',
                  }}
                />
                <Button
                  label={t('expenses.detail.commentSend')}
                  variant="accent"
                  onPress={sendComment}
                  disabled={commentMutation.isPending || commentDraft.trim() === ''}
                  loading={commentMutation.isPending}
                  trailing="none"
                  labelCase="none"
                  accessibilityLabel={t('expenses.detail.commentSendA11y')}
                />
              </View>
            </>
          ) : null}

          {panel === 'files' ? (
            <View style={styles.section}>
              <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                {t('expenses.detail.attachmentsSection')}
              </Text>
              {detail.attachments.length === 0 ? (
                <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                  {t('expenses.detail.emptyAttachments')}
                </Text>
              ) : (
                <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
                  {detail.attachments.map((row, index) => {
                    const url = pickAttachmentUrl(row);
                    const label =
                      expenseDetailTitleLine(row) ??
                      (url ? url.slice(0, 48) : t('expenses.detail.attachmentOpenA11y'));
                    const typeLabel =
                      typeof row['type'] === 'string'
                        ? row['type']
                        : typeof row['mimeType'] === 'string'
                          ? row['mimeType']
                          : undefined;
                    return (
                      <Pressable
                        key={`${index}-${url ?? label}`}
                        accessibilityRole="link"
                        accessibilityHint={t('expenses.detail.attachmentOpenHint')}
                        accessibilityLabel={t('expenses.detail.attachmentOpenA11y')}
                        disabled={!url}
                        onPress={() => {
                          if (url) void onOpenUrl(url);
                        }}
                        style={({ pressed }) => [{ opacity: !url || pressed ? 0.65 : 1 }]}
                      >
                        <View
                          style={[
                            styles.cardRow,
                            {
                              borderColor: palette.groupHubBorder,
                              backgroundColor: palette.groupHubCard,
                            },
                          ]}
                        >
                          <Text style={[textStyles.body, { color: palette.groupHubAccent }]}>
                            {label}
                          </Text>
                          {typeLabel ? (
                            <Text style={[styles.monoMeta, { color: palette.groupHubMuted }]}>
                              {typeLabel}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View style={{ marginTop: space.gapLg, gap: space.gapSm }}>
                {uploadPct !== null ? (
                  <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                    {t('expenses.receiptsUpload.progressLabel', { pct: uploadPct })}
                  </Text>
                ) : null}
                <Button
                  label={
                    receiptMutation.isPending && uploadPct !== null
                      ? t('expenses.receiptsUpload.progressLabel', { pct: uploadPct })
                      : t('expenses.detail.receiptPick')
                  }
                  variant="secondary"
                  onPress={() => void pickAndUploadReceipt()}
                  disabled={receiptMutation.isPending}
                  loading={receiptMutation.isPending}
                  trailing="none"
                  labelCase="none"
                  accessibilityLabel={t('expenses.detail.receiptPickA11y')}
                />
              </View>
            </View>
          ) : null}

          {panel === 'history' ? (
            <View style={styles.section}>
              <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                {t('expenses.detail.historySection')}
              </Text>
              {renderLooseRows(
                detail.history,
                'expenses.detail.emptyHistory',
                (row) => expenseDetailHistoryLine(row) ?? expenseDetailTitleLine(row),
                (row) =>
                  typeof row['createdAt'] === 'string'
                    ? formatGroupTimestamp(row['createdAt'], t)
                    : typeof row['at'] === 'string'
                      ? formatGroupTimestamp(row['at'], t)
                      : undefined,
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
