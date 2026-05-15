import { EXPENSE_COMMENT_MESSAGE_MAX_LENGTH } from '@/features/expenses/constants/expenseComment';

export type CommentComposerDerived = {
  length: number;
  trimmedEmpty: boolean;
  overMax: boolean;
  canSubmit: boolean;
};

/** Pure helpers — tested without RN primitives. */
export function deriveCommentComposerState(rawMessage: string): CommentComposerDerived {
  const length = rawMessage.length;
  const trimmedEmpty = rawMessage.trim() === '';
  const overMax = length > EXPENSE_COMMENT_MESSAGE_MAX_LENGTH;
  return {
    length,
    trimmedEmpty,
    overMax,
    canSubmit: !trimmedEmpty && !overMax,
  };
}
