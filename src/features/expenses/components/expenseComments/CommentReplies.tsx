import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { CommentComposer } from '@/features/expenses/components/expenseComments/CommentComposer';
import { CommentRow } from '@/features/expenses/components/expenseComments/CommentRow';
import { useCreateExpenseComment } from '@/features/expenses/hooks/useCreateExpenseComment';
import { useDeleteExpenseComment } from '@/features/expenses/hooks/useDeleteExpenseComment';
import { useExpenseCommentsInfinite } from '@/features/expenses/hooks/useExpenseCommentsInfinite';
import { usePatchExpenseComment } from '@/features/expenses/hooks/usePatchExpenseComment';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';
import { mergeExpenseCommentInfinitePages } from '@/features/expenses/utils/expenseCommentCache';
import { layoutGrid, textStyles, useThemeColors } from '@/theme';

export type CommentRepliesProps = {
  groupId: string;
  expenseId: string;
  rootCommentId: string;
  currentUserId: string;
  isModerator: boolean;
};

export function CommentReplies({
  groupId,
  expenseId,
  rootCommentId,
  currentUserId,
  isModerator,
}: CommentRepliesProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const listQuery = useExpenseCommentsInfinite({
    groupId,
    expenseId,
    parentCommentId: rootCommentId,
  });

  const createMutation = useCreateExpenseComment(groupId, expenseId);
  const patchMutation = usePatchExpenseComment(groupId, expenseId);
  const deleteMutation = useDeleteExpenseComment(groupId, expenseId);

  const items = useMemo(
    () => mergeExpenseCommentInfinitePages(listQuery.data?.pages, 'desc'),
    [listQuery.data?.pages],
  );

  const [draft, setDraft] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);

  return (
    <View style={[styles.nest, { borderLeftColor: palette.borderSubtle }]}>
      {listQuery.isLoading ? (
        <ActivityIndicator color={palette.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
              {t('expenses.comments.repliesEmpty')}
            </Text>
          }
          ListHeaderComponent={
            listQuery.hasNextPage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('expenses.comments.loadMoreA11y')}
                disabled={listQuery.isFetchingNextPage}
                onPress={() => void listQuery.fetchNextPage()}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.72 : 1, paddingVertical: layoutGrid.micro },
                ]}
              >
                <Text style={[textStyles.captionSmall, { color: palette.accent }]}>
                  {listQuery.isFetchingNextPage
                    ? t('expenses.comments.loadingMore')
                    : t('expenses.comments.loadMore')}
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              currentUserId={currentUserId}
              deleteBusy={deleteMutation.isPending}
              isModerator={isModerator}
              patchBusy={patchMutation.isPending}
              onDelete={(id) => deleteMutation.mutateAsync(id)}
              onPatch={(id, msg) => patchMutation.mutateAsync({ commentId: id, message: msg })}
            />
          )}
        />
      )}

      <CommentComposer
        busy={createMutation.isPending}
        draft={draft}
        placeholder={t('expenses.comments.replyPlaceholder')}
        serverError={composerError}
        submitA11y={t('expenses.comments.replySendA11y')}
        submitLabel={t('expenses.comments.replySend')}
        onDraftChange={(tx) => {
          setComposerError(null);
          setDraft(tx);
        }}
        onSubmit={() => {
          setComposerError(null);
          createMutation.mutate(
            { message: draft, parentCommentId: rootCommentId },
            {
              onSuccess: () => setDraft(''),
              onError: (err) => {
                const p = parseExpenseCommentApiError(err);
                if (p.kind === 'invalid_parent') {
                  setComposerError(t('expenses.comments.invalidParent'));
                  return;
                }
                if (p.kind === 'validation') {
                  setComposerError(p.details?.[0] ?? t('expenses.comments.validationGeneric'));
                  return;
                }
                setComposerError(t('expenses.comments.errorGeneric'));
              },
            },
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nest: {
    marginLeft: layoutGrid.sm,
    paddingLeft: layoutGrid.sm,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
});
