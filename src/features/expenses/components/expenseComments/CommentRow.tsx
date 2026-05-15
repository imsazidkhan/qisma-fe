import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EXPENSE_COMMENT_MESSAGE_MAX_LENGTH } from '@/features/expenses/constants/expenseComment';
import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';
import { formatExpenseCommentRelativeShort } from '@/features/expenses/utils/expenseCommentRelativeTime';
import { layoutGrid, radius, textStyles, typography, useThemeColors } from '@/theme';

const EDIT_THRESHOLD_MS = 1000;

export type CommentRowProps = {
  comment: ExpenseCommentEntry;
  currentUserId: string;
  isModerator: boolean;
  onPatch: (commentId: string, message: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  patchBusy?: boolean;
  deleteBusy?: boolean;
  onReplyPress?: () => void;
};

export function CommentRow({
  comment,
  currentUserId,
  isModerator,
  onPatch,
  onDelete,
  patchBusy = false,
  deleteBusy = false,
  onReplyPress,
}: CommentRowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.message);

  const displayName = useMemo(() => {
    const n = comment.user.name?.trim();
    const u = comment.user.username?.trim();
    if (n) return n;
    if (u) return `@${u}`;
    return t('expenses.comments.fallbackName');
  }, [comment.user.name, comment.user.username, t]);

  const handle = comment.user.username?.trim();
  const subtitle = handle ? `@${handle}` : null;

  const isEdited = useMemo(() => {
    const c = Date.parse(comment.createdAt);
    const u = Date.parse(comment.updatedAt);
    if (Number.isNaN(c) || Number.isNaN(u)) return false;
    return u > c + EDIT_THRESHOLD_MS;
  }, [comment.createdAt, comment.updatedAt]);

  const canModerate = comment.userId === currentUserId || isModerator;
  const showReply = comment.parentCommentId === null;

  const avatarLetter = displayName.replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?';

  const relative = formatExpenseCommentRelativeShort(comment.createdAt);

  const menuDisabled = !canModerate || patchBusy || deleteBusy;

  const openMenu = (): void => {
    if (menuDisabled) return;
    Alert.alert(t('expenses.comments.actionsTitle'), undefined, [
      {
        text: t('expenses.comments.edit'),
        onPress: () => {
          setEditDraft(comment.message);
          setEditing(true);
        },
      },
      {
        text: t('expenses.comments.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('expenses.comments.deleteConfirmTitle'),
            t('expenses.comments.deleteConfirmBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('expenses.comments.delete'),
                style: 'destructive',
                onPress: () => {
                  void onDelete(comment.id).catch((err: unknown) => {
                    const p = parseExpenseCommentApiError(err);
                    if (p.kind === 'forbidden') {
                      Alert.alert(
                        t('expenses.comments.errorTitle'),
                        t('expenses.comments.forbiddenModify'),
                      );
                      return;
                    }
                    if (p.kind === 'comment_not_found') {
                      Alert.alert(
                        t('expenses.comments.errorTitle'),
                        t('expenses.comments.commentMissing'),
                      );
                    }
                  });
                },
              },
            ],
          );
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceOverlay },
        ]}
      >
        {comment.user.avatar ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: comment.user.avatar }}
            style={styles.avatarImg}
          />
        ) : (
          <Text style={[textStyles.label, { color: palette.textMuted }]}>{avatarLetter}</Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.identity}>
            <Text style={[textStyles.body, { color: palette.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            {subtitle ? (
              <Text
                style={[textStyles.captionSmall, { color: palette.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>{relative}</Text>
        </View>
        {editing ? (
          <View style={{ gap: layoutGrid.sm }}>
            <TextInput
              multiline
              scrollEnabled={false}
              value={editDraft}
              maxLength={EXPENSE_COMMENT_MESSAGE_MAX_LENGTH}
              onChangeText={(tx) => setEditDraft(tx.slice(0, EXPENSE_COMMENT_MESSAGE_MAX_LENGTH))}
              style={[
                styles.editBox,
                {
                  borderColor: palette.borderSubtle,
                  color: palette.textPrimary,
                  backgroundColor: palette.surfaceElevated,
                },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: layoutGrid.sm }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                onPress={() => setEditing(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: layoutGrid.sm }]}
              >
                <Text style={[textStyles.body, { color: palette.textSecondary }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('expenses.comments.save')}
                disabled={patchBusy || editDraft.trim() === ''}
                onPress={() => {
                  void onPatch(comment.id, editDraft.trim())
                    .then(() => setEditing(false))
                    .catch((err: unknown) => {
                      const p = parseExpenseCommentApiError(err);
                      if (p.kind === 'forbidden') {
                        Alert.alert(
                          t('expenses.comments.errorTitle'),
                          t('expenses.comments.forbiddenModify'),
                        );
                        return;
                      }
                      if (p.kind === 'comment_not_found') {
                        Alert.alert(
                          t('expenses.comments.errorTitle'),
                          t('expenses.comments.commentMissing'),
                        );
                      }
                    });
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: layoutGrid.sm }]}
              >
                <Text style={[textStyles.body, { color: palette.accent }]}>
                  {t('expenses.comments.save')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>{comment.message}</Text>
        )}
        <View style={styles.metaRow}>
          {isEdited ? (
            <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
              {t('expenses.comments.edited')}
            </Text>
          ) : null}
          {showReply && onReplyPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('expenses.comments.replyA11y')}
              hitSlop={8}
              onPress={onReplyPress}
              style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
            >
              <Text style={[textStyles.captionSmall, { color: palette.textSecondary }]}>
                {t('expenses.comments.reply')}
              </Text>
            </Pressable>
          ) : null}
          {!menuDisabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('expenses.comments.moreA11y')}
              hitSlop={8}
              onPress={openMenu}
              style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1, marginLeft: 'auto' }]}
            >
              <Text style={[textStyles.body, { color: palette.textMuted }]}>⋯</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const AV = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
    paddingVertical: layoutGrid.sm,
  },
  avatar: {
    width: AV,
    height: AV,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: AV,
    height: AV,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: layoutGrid.micro,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layoutGrid.sm,
    alignItems: 'flex-start',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: layoutGrid.micro,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
    flexWrap: 'wrap',
  },
  editBox: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: layoutGrid.sm,
    fontFamily: typography.fontFamily.sans.regular,
    textAlignVertical: 'top',
  },
});
