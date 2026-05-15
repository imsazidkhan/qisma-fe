import { ApiError, CLIENT_ERROR_CODES } from '@/api/ApiError';
import { apiFetch } from '@/api/apiFetch';
import { ENDPOINTS } from '@/api/endpoints';
import {
  EXPENSE_COMMENT_CLIENT_CODES,
  validateExpenseCommentMessage,
} from '@/features/expenses/constants/expenseComment';
import {
  parseExpenseCommentEntry,
  parseListExpenseCommentsResponse,
  type AddExpenseCommentRequestBody,
  type DeleteExpenseCommentResponse,
  type ExpenseCommentEntry,
  type ListExpenseCommentsResponse,
  type PatchExpenseCommentRequestBody,
} from '@/features/expenses/types/expenseComment.types';

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

export type ListExpenseCommentsParams = {
  groupId: string;
  expenseId: string;
  parentCommentId?: string | null;
  cursor?: string | null;
  limit?: number;
  /** Omit → `desc` (newest first on page 1; cursor returns older pages). */
  sort?: 'asc' | 'desc';
  signal?: AbortSignal;
};

export async function listExpenseComments(
  params: ListExpenseCommentsParams,
): Promise<ListExpenseCommentsResponse> {
  const gid = params.groupId.trim();
  const eid = params.expenseId.trim();
  const sp = new URLSearchParams();
  if (params.cursor !== undefined && params.cursor !== null && params.cursor !== '') {
    sp.set('cursor', params.cursor);
  }
  if (params.limit !== undefined) {
    sp.set('limit', String(params.limit));
  }
  const sort = params.sort ?? 'desc';
  sp.set('sort', sort);
  const parent = params.parentCommentId?.trim();
  if (parent) {
    sp.set('parentCommentId', parent);
  }
  const qs = sp.toString();
  const path = `${ENDPOINTS.expenses.groupExpenseComments(gid, eid)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, {
    method: 'GET',
    signal: params.signal,
  });
  try {
    return parseListExpenseCommentsResponse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid expense comments list shape.';
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message,
      status: 0,
    });
  }
}

export async function createExpenseComment(
  groupId: string,
  expenseId: string,
  body: AddExpenseCommentRequestBody,
  signal?: AbortSignal,
): Promise<ExpenseCommentEntry> {
  const validated = validateExpenseCommentMessage(body.message);
  if (!validated.ok) {
    throwInvalidCommentMessage(validated.code);
  }
  const payload: Record<string, string> = { message: validated.message };
  const parent = body.parentCommentId?.trim();
  if (parent) payload.parentCommentId = parent;

  const raw = await apiFetch<unknown>(
    ENDPOINTS.expenses.groupExpenseComments(groupId.trim(), expenseId.trim()),
    {
      method: 'POST',
      body: payload,
      signal,
    },
  );
  return parseExpenseCommentResponse(raw);
}

export async function patchExpenseComment(
  groupId: string,
  expenseId: string,
  commentId: string,
  body: PatchExpenseCommentRequestBody,
  signal?: AbortSignal,
): Promise<ExpenseCommentEntry> {
  const validated = validateExpenseCommentMessage(body.message);
  if (!validated.ok) {
    throwInvalidCommentMessage(validated.code);
  }
  const raw = await apiFetch<unknown>(
    ENDPOINTS.expenses.groupExpenseComment(groupId.trim(), expenseId.trim(), commentId.trim()),
    {
      method: 'PATCH',
      body: { message: validated.message },
      signal,
    },
  );
  return parseExpenseCommentResponse(raw);
}

export async function deleteExpenseComment(
  groupId: string,
  expenseId: string,
  commentId: string,
  signal?: AbortSignal,
): Promise<DeleteExpenseCommentResponse> {
  const raw = await apiFetch<unknown>(
    ENDPOINTS.expenses.groupExpenseComment(groupId.trim(), expenseId.trim(), commentId.trim()),
    {
      method: 'DELETE',
      signal,
    },
  );
  if (raw === null || typeof raw !== 'object') {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid delete expense comment response.',
      status: 0,
    });
  }
  const o = raw as Record<string, unknown>;
  const cid = typeof o.commentId === 'string' ? o.commentId : '';
  const deletedAt = typeof o.deletedAt === 'string' ? o.deletedAt : '';
  if (cid === '' || deletedAt === '') {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Delete expense comment response missing commentId/deletedAt.',
      status: 0,
    });
  }
  return { commentId: cid, deletedAt };
}

/** Maps client-side validation errors for alerts (legacy send-comment UI). */
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
