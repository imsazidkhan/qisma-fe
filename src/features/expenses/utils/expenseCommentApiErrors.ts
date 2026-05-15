import { ApiError } from '@/api/ApiError';
import { EXPENSE_COMMENT_SERVICE_CODES } from '@/features/expenses/constants/expenseCommentErrors';

export type ParsedExpenseCommentApiError =
  | { kind: 'validation'; details?: string[] }
  | { kind: 'invalid_cursor' }
  | { kind: 'invalid_parent' }
  | { kind: 'not_group_member' }
  | { kind: 'forbidden' }
  | { kind: 'expense_not_found' }
  | { kind: 'comment_not_found' }
  | { kind: 'unknown'; code?: string };

/** Normalize Veloraq comment errors for UI + hook recovery paths (never trust free-form messages). */
export function parseExpenseCommentApiError(err: unknown): ParsedExpenseCommentApiError {
  if (!(err instanceof ApiError)) {
    return { kind: 'unknown' };
  }
  switch (err.code) {
    case EXPENSE_COMMENT_SERVICE_CODES.VALIDATION_ERROR:
      return { kind: 'validation', details: err.details };
    case EXPENSE_COMMENT_SERVICE_CODES.INVALID_EXPENSE_CURSOR:
      return { kind: 'invalid_cursor' };
    case EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_COMMENT_INVALID_PARENT:
      return { kind: 'invalid_parent' };
    case EXPENSE_COMMENT_SERVICE_CODES.NOT_GROUP_MEMBER:
      return { kind: 'not_group_member' };
    case EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_COMMENT_FORBIDDEN:
      return { kind: 'forbidden' };
    case EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_NOT_FOUND:
      return { kind: 'expense_not_found' };
    case EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_COMMENT_NOT_FOUND:
      return { kind: 'comment_not_found' };
    default:
      return { kind: 'unknown', code: err.code };
  }
}
