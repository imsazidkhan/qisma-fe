import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/ApiError';
import { EXPENSE_COMMENT_SERVICE_CODES } from '@/features/expenses/constants/expenseCommentErrors';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';

describe('parseExpenseCommentApiError', () => {
  it('maps INVALID_EXPENSE_CURSOR', () => {
    const err = new ApiError({
      code: EXPENSE_COMMENT_SERVICE_CODES.INVALID_EXPENSE_CURSOR,
      message: 'bad cursor',
      status: 400,
    });
    expect(parseExpenseCommentApiError(err)).toEqual({ kind: 'invalid_cursor' });
  });

  it('maps EXPENSE_COMMENT_FORBIDDEN', () => {
    const err = new ApiError({
      code: EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_COMMENT_FORBIDDEN,
      message: 'nope',
      status: 403,
    });
    expect(parseExpenseCommentApiError(err)).toEqual({ kind: 'forbidden' });
  });

  it('maps EXPENSE_COMMENT_INVALID_PARENT', () => {
    const err = new ApiError({
      code: EXPENSE_COMMENT_SERVICE_CODES.EXPENSE_COMMENT_INVALID_PARENT,
      message: 'parent',
      status: 400,
    });
    expect(parseExpenseCommentApiError(err)).toEqual({ kind: 'invalid_parent' });
  });

  it('maps VALIDATION_ERROR with details', () => {
    const err = new ApiError({
      code: EXPENSE_COMMENT_SERVICE_CODES.VALIDATION_ERROR,
      message: 'validation',
      status: 400,
      details: ['too short'],
    });
    expect(parseExpenseCommentApiError(err)).toEqual({
      kind: 'validation',
      details: ['too short'],
    });
  });
});
