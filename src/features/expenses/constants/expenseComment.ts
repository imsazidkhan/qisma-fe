/** Align with backend max (e.g. 8k chars). */
export const EXPENSE_COMMENT_MESSAGE_MAX_LENGTH = 8000;

export const EXPENSE_COMMENT_CLIENT_CODES = {
  EMPTY: 'EXPENSE_COMMENT_EMPTY',
  TOO_LONG: 'EXPENSE_COMMENT_TOO_LONG',
} as const;

export type ExpenseCommentClientCode =
  (typeof EXPENSE_COMMENT_CLIENT_CODES)[keyof typeof EXPENSE_COMMENT_CLIENT_CODES];

export type ExpenseCommentMessageValidation =
  | { ok: true; message: string }
  | { ok: false; code: ExpenseCommentClientCode };

/** Trim; reject empty or over max length before calling the API. */
export function validateExpenseCommentMessage(raw: string): ExpenseCommentMessageValidation {
  const message = raw.trim();
  if (message.length === 0) {
    return { ok: false, code: EXPENSE_COMMENT_CLIENT_CODES.EMPTY };
  }
  if (message.length > EXPENSE_COMMENT_MESSAGE_MAX_LENGTH) {
    return { ok: false, code: EXPENSE_COMMENT_CLIENT_CODES.TOO_LONG };
  }
  return { ok: true, message };
}
