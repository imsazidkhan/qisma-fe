import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentComposer } from '@/features/expenses/components/expenseComments/CommentComposer';
import { CommentReplies } from '@/features/expenses/components/expenseComments/CommentReplies';
import { CommentRow } from '@/features/expenses/components/expenseComments/CommentRow';
import { useCreateExpenseComment } from '@/features/expenses/hooks/useCreateExpenseComment';
import { useDeleteExpenseComment } from '@/features/expenses/hooks/useDeleteExpenseComment';
import { useExpenseCommentsInfinite } from '@/features/expenses/hooks/useExpenseCommentsInfinite';
import { usePatchExpenseComment } from '@/features/expenses/hooks/usePatchExpenseComment';
import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';
import { mergeExpenseCommentInfinitePages } from '@/features/expenses/utils/expenseCommentCache';
import { layoutGrid, space, textStyles, useThemeColors } from '@/theme';

export type ExpenseCommentsSectionProps = {
  groupId: string;
  expenseId: string;
  currentUserId: string;
  isModerator: boolean;
};

export function ExpenseCommentsSection({
  groupId,
  expenseId,
  currentUserId,
  isModerator,
}: ExpenseCommentsSectionProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();

  const listQuery = useExpenseCommentsInfinite({ groupId, expenseId });
  const createMutation = useCreateExpenseComment(groupId, expenseId);
  const patchMutation = usePatchExpenseComment(groupId, expenseId);
  const deleteMutation = useDeleteExpenseComment(groupId, expenseId);

  const items = useMemo(
    () => mergeExpenseCommentInfinitePages(listQuery.data?.pages, 'desc'),
    [listQuery.data?.pages],
  );

  const [expandedReplyRoots, setExpandedReplyRoots] = useState<Record<string, boolean>>({});
  const [rootDraft, setRootDraft] = useState('');
  const [rootComposerError, setRootComposerError] = useState<string | null>(null);

  const toggleReplies = useCallback((rootId: string) => {
    setExpandedReplyRoots((prev) => ({ ...prev, [rootId]: !prev[rootId] }));
  }, []);

  const listErrKind = listQuery.error ? parseExpenseCommentApiError(listQuery.error).kind : null;

  const renderItem = useCallback(
    ({ item }: { item: ExpenseCommentEntry }) => (
      <View style={styles.threadBlock}>
        <CommentRow
          comment={item}
          currentUserId={currentUserId}
          deleteBusy={deleteMutation.isPending}
          isModerator={isModerator}
          patchBusy={patchMutation.isPending}
          onDelete={(id) => deleteMutation.mutateAsync(id)}
          onPatch={(id, msg) => patchMutation.mutateAsync({ commentId: id, message: msg })}
          onReplyPress={() => toggleReplies(item.id)}
        />
        {expandedReplyRoots[item.id] ? (
          <CommentReplies
            currentUserId={currentUserId}
            expenseId={expenseId}
            groupId={groupId}
            isModerator={isModerator}
            rootCommentId={item.id}
          />
        ) : null}
      </View>
    ),
    [
      currentUserId,
      deleteMutation,
      expandedReplyRoots,
      expenseId,
      groupId,
      isModerator,
      patchMutation,
      toggleReplies,
    ],
  );

  const keyExtractor = useCallback((c: ExpenseCommentEntry) => c.id, []);

  return (
    <View style={styles.flex}>
      {listErrKind === 'expense_not_found' ? (
        <Text style={[textStyles.body, { color: palette.errorText }]}>
          {t('expenses.comments.expenseMissing')}
        </Text>
      ) : null}
      {listErrKind === 'not_group_member' ? (
        <Text style={[textStyles.body, { color: palette.errorText }]}>
          {t('expenses.comments.notMemberBody')}
        </Text>
      ) : null}
      {listQuery.isLoading && items.length === 0 ? (
        <View style={styles.skeletonShell}>
          <ActivityIndicator
            accessibilityLabel={t('expenses.comments.loadingA11y')}
            color={palette.accent}
          />
        </View>
      ) : null}

      {listQuery.isError &&
      listErrKind !== 'expense_not_found' &&
      listErrKind !== 'not_group_member' &&
      listErrKind !== 'invalid_cursor' ? (
        <View style={{ gap: layoutGrid.sm }}>
          <Text style={[textStyles.body, { color: palette.errorText }]}>
            {t('expenses.comments.listError')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.comments.retryA11y')}
            onPress={() => void listQuery.refetch()}
          >
            <Text style={[textStyles.label, { color: palette.accent }]}>
              {t('expenses.comments.retry')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={items}
        extraData={expandedReplyRoots}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          listQuery.isLoading ? null : (
            <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
              {t('expenses.comments.rootEmpty')}
            </Text>
          )
        }
        ListHeaderComponent={
          listQuery.hasNextPage ? (
            <View style={{ paddingBottom: layoutGrid.sm }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('expenses.comments.loadMoreA11y')}
                disabled={listQuery.isFetchingNextPage}
                onPress={() => void listQuery.fetchNextPage()}
                style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
              >
                <Text style={[textStyles.captionSmall, { color: palette.accent }]}>
                  {listQuery.isFetchingNextPage
                    ? t('expenses.comments.loadingMore')
                    : t('expenses.comments.loadMore')}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={renderItem}
        style={styles.list}
      />
      <View
        style={[
          styles.composerDock,
          {
            borderTopColor: palette.borderSubtle,
            backgroundColor: palette.background,
            paddingBottom: Math.max(insets.bottom, space.gapSm),
          },
        ]}
      >
        <CommentComposer
          busy={createMutation.isPending}
          draft={rootDraft}
          placeholder={t('expenses.comments.rootPlaceholder')}
          serverError={rootComposerError}
          submitA11y={t('expenses.comments.rootSendA11y')}
          submitLabel={t('expenses.comments.rootSend')}
          onDraftChange={(tx) => {
            setRootComposerError(null);
            setRootDraft(tx);
          }}
          onSubmit={() => {
            setRootComposerError(null);
            createMutation.mutate(
              { message: rootDraft },
              {
                onSuccess: () => setRootDraft(''),
                onError: (err) => {
                  const p = parseExpenseCommentApiError(err);
                  if (p.kind === 'invalid_parent') {
                    setRootComposerError(t('expenses.comments.invalidParent'));
                    return;
                  }
                  if (p.kind === 'validation') {
                    setRootComposerError(
                      p.details?.[0] ?? t('expenses.comments.validationGeneric'),
                    );
                    return;
                  }
                  setRootComposerError(t('expenses.comments.errorGeneric'));
                },
              },
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flex: 1 },
  composerDock: {
    alignSelf: 'stretch',
    paddingTop: layoutGrid.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  threadBlock: {
    alignSelf: 'stretch',
    gap: layoutGrid.micro,
    paddingBottom: layoutGrid.sm,
  },
  skeletonShell: {
    paddingVertical: layoutGrid.section,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
