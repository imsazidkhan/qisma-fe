import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import {
  EXPENSE_COMMENT_CLIENT_CODES,
  validateExpenseCommentMessage,
} from '@/features/expenses/constants/expenseComment';
import {
  parseExpenseCommentEntry,
  type AddExpenseCommentRequestBody,
  type ExpenseCommentEntry,
} from '@/features/expenses/types/expenseComment.types';

const MOCK_FLAG = process.env.EXPO_PUBLIC_MOCK_EXPENSES === '1';

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function mockCreateExpenseComment(
  expenseId: string,
  body: AddExpenseCommentRequestBody,
): Promise<ExpenseCommentEntry> {
  void expenseId;
  await new Promise((r) => setTimeout(r, 280));
  const now = new Date().toISOString();
  const userId = '00000000-0000-4000-8000-000000000099';
  return {
    id: randomUuid(),
    userId,
    message: body.message,
    createdAt: now,
    author: {
      id: userId,
      name: 'You',
      username: 'you',
      avatar: null,
    },
  };
}

function throwInvalidCommentMessage(
  code: (typeof EXPENSE_COMMENT_CLIENT_CODES)[keyof typeof EXPENSE_COMMENT_CLIENT_CODES],
): never {
  throw new ApiError({
    code,
    message:
      code === EXPENSE_COMMENT_CLIENT_CODES.EMPTY
        ? 'Comment message must be non-empty.'
        : 'Comment exceeds maximum length.',
    status: 0,
  });
}

export function parseExpenseCommentResponse(data: unknown): ExpenseCommentEntry {
  try {
    return parseExpenseCommentEntry(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid expense comment response shape.';
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message,
      status: 0,
    });
  }
}

export function mapExpenseCommentError(err: unknown): { titleKey: string; messageKey: string } {
  if (err instanceof ApiError) {
    if (err.code === EXPENSE_COMMENT_CLIENT_CODES.EMPTY) {
      return {
        titleKey: 'expenses.comments.errorTitle',
        messageKey: 'expenses.comments.validationEmpty',
      };
    }
    if (err.code === EXPENSE_COMMENT_CLIENT_CODES.TOO_LONG) {
      return {
        titleKey: 'expenses.comments.errorTitle',
        messageKey: 'expenses.comments.validationTooLong',
      };
    }
    return {
      titleKey: 'expenses.comments.errorTitle',
      messageKey: 'expenses.comments.errorGeneric',
    };
  }
  return {
    titleKey: 'expenses.comments.errorTitle',
    messageKey: 'expenses.comments.errorGeneric',
  };
}

/**
 * `POST /v1/expenses/:id/comments` — body `{ message }` (trimmed, non-empty, max length enforced).
 * Success is typically **201**; response `data` is `ExpenseCommentEntryDto`.
 */
export async function createExpenseComment(
  expenseId: string,
  body: AddExpenseCommentRequestBody,
  signal?: AbortSignal,
): Promise<ExpenseCommentEntry> {
  const validated = validateExpenseCommentMessage(body.message);
  if (!validated.ok) {
    throwInvalidCommentMessage(validated.code);
  }
  const payload: AddExpenseCommentRequestBody = { message: validated.message };

  if (MOCK_FLAG) {
    return mockCreateExpenseComment(expenseId, payload);
  }

  const raw = await apiFetch<unknown>(ENDPOINTS.expenses.comments(expenseId), {
    method: 'POST',
    body: payload,
    signal,
  });
  return parseExpenseCommentResponse(raw);
}
