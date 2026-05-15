export const EXPENSE_FEED_ERROR_CODES = {
  INVALID_EXPENSE_CURSOR: 'INVALID_EXPENSE_CURSOR',
} as const;

export type ExpenseFeedErrorCode =
  (typeof EXPENSE_FEED_ERROR_CODES)[keyof typeof EXPENSE_FEED_ERROR_CODES];

export const EXPENSE_DETAIL_ERROR_CODES = {
  /** Soft-deleted or unknown expense — API may return 404 with this code. */
  EXPENSE_NOT_FOUND: 'EXPENSE_NOT_FOUND',
  /** `expectedUpdatedAt` did not match current `updatedAt`. */
  EXPENSE_STALE_VERSION: 'EXPENSE_STALE_VERSION',
} as const;

export type ExpenseDetailErrorCode =
  (typeof EXPENSE_DETAIL_ERROR_CODES)[keyof typeof EXPENSE_DETAIL_ERROR_CODES];
