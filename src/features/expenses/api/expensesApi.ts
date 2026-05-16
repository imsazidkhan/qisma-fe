import { apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { ApiError } from '@/api/ApiError';
import { EXPENSE_DETAIL_ERROR_CODES } from '@/features/expenses/constants/errorCodes';
import type {
  CreateExpenseResponse,
  CreateGroupExpenseBody,
  DeleteExpenseResponse,
  ExpenseCore,
  PatchExpenseBody,
  PatchExpenseResponse,
} from '@/features/expenses/types/expense.types';

const MOCK_FLAG = process.env.EXPO_PUBLIC_MOCK_EXPENSES === '1';

/** In-memory ids already soft-deleted in mock mode — second `DELETE` → 404. */
const MOCK_SOFT_DELETED_EXPENSE_IDS = new Set<string>();

async function mockPatchExpense(
  _groupId: string,
  expenseId: string,
  body: PatchExpenseBody,
): Promise<PatchExpenseResponse> {
  await new Promise((r) => setTimeout(r, 350));
  const currency = (body.currency ?? 'INR').trim() || 'INR';
  const expense: ExpenseCore = {
    id: expenseId,
    groupId: _groupId,
    title: body.title ?? 'Mock expense',
    amount: body.amount ?? '0',
    currency,
    date: body.date ?? '2026-01-01',
    paidByUserId: body.paidByUserId ?? '00000000-0000-4000-8000-000000000001',
    deletedAt: null,
  };
  return {
    expense,
    groupBalances: { netByUserId: {}, edges: [] },
  };
}

async function mockCreateGroupExpense(
  groupId: string,
  body: CreateGroupExpenseBody,
): Promise<CreateExpenseResponse> {
  await new Promise((r) => setTimeout(r, 350));
  const currency = (body.currency ?? 'INR').trim() || 'INR';
  const expense: ExpenseCore = {
    id: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`,
    groupId,
    title: body.title.trim() || 'Expense',
    amount: body.amount,
    currency,
    date: body.date,
    paidByUserId: body.paidByUserId,
    deletedAt: null,
  };
  return {
    expense,
    groupBalances: { netByUserId: {}, edges: [] },
  };
}

async function mockDeleteExpense(
  groupId: string,
  expenseId: string,
): Promise<DeleteExpenseResponse> {
  await new Promise((r) => setTimeout(r, 300));
  if (MOCK_SOFT_DELETED_EXPENSE_IDS.has(expenseId)) {
    throw new ApiError({
      code: EXPENSE_DETAIL_ERROR_CODES.EXPENSE_NOT_FOUND,
      message: 'Expense already deleted.',
      status: 404,
    });
  }
  MOCK_SOFT_DELETED_EXPENSE_IDS.add(expenseId);
  const now = new Date().toISOString();
  const expense: ExpenseCore = {
    id: expenseId,
    groupId,
    title: 'Mock expense',
    amount: '0',
    currency: 'INR',
    date: '2026-01-01',
    paidByUserId: '00000000-0000-4000-8000-000000000001',
    deletedAt: now,
  };
  return {
    expense,
    groupBalances: { netByUserId: {}, edges: [] },
  };
}

/** `POST /v1/groups/:groupId/expenses` — create expense in a group. */
export function createGroupExpense(
  groupId: string,
  body: CreateGroupExpenseBody,
  signal?: AbortSignal,
): Promise<CreateExpenseResponse> {
  if (MOCK_FLAG) {
    return mockCreateGroupExpense(groupId, body);
  }
  return apiFetch<CreateExpenseResponse>(ENDPOINTS.expenses.groupCreate(groupId), {
    method: 'POST',
    body,
    signal,
  });
}

/**
 * `PATCH /v1/groups/:groupId/expenses/:expenseId` — partial update. If `amount` or `paidByUserId`
 * changes, send full `split`. Optional `expectedUpdatedAt` prevents stale writes.
 */
export function patchExpense(
  groupId: string,
  expenseId: string,
  body: PatchExpenseBody,
  signal?: AbortSignal,
): Promise<PatchExpenseResponse> {
  if (MOCK_FLAG) {
    return mockPatchExpense(groupId, expenseId, body);
  }
  return apiFetch<PatchExpenseResponse>(ENDPOINTS.expenses.groupExpense(groupId, expenseId), {
    method: 'PATCH',
    body,
    signal,
  });
}

/**
 * `DELETE /v1/groups/:groupId/expenses/:expenseId` — soft-delete. Second delete → **404** (`EXPENSE_NOT_FOUND`).
 */
export function deleteExpense(
  groupId: string,
  expenseId: string,
  signal?: AbortSignal,
): Promise<DeleteExpenseResponse> {
  if (MOCK_FLAG) {
    return mockDeleteExpense(groupId, expenseId);
  }
  return apiFetch<DeleteExpenseResponse>(ENDPOINTS.expenses.groupExpense(groupId, expenseId), {
    method: 'DELETE',
    signal,
  });
}

export function mapExpensePatchError(err: unknown): { titleKey: string; messageKey: string } {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      return {
        titleKey: 'expenses.edit.errorTitle',
        messageKey: 'expenses.edit.errorServerAmbiguous',
      };
    }
    let messageKey: string = 'expenses.edit.errorGeneric';
    if (err.code === 'SPLIT_VALIDATION_ERROR') {
      messageKey = 'expenses.edit.errorSplitFinancial';
    } else if (
      err.code === EXPENSE_DETAIL_ERROR_CODES.EXPENSE_STALE_VERSION ||
      err.status === 409
    ) {
      messageKey = 'expenses.edit.errorStaleVersion';
    }
    return {
      titleKey: 'expenses.edit.errorTitle',
      messageKey,
    };
  }
  return {
    titleKey: 'expenses.edit.errorTitle',
    messageKey: 'expenses.edit.errorGeneric',
  };
}

export type MappedExpenseCreateError = {
  titleKey: string;
  messageKey: string;
  /** Server validation lines — safe to show; no PII in typical Nest `details[]`. */
  messagePlain?: string;
};

export function mapExpenseCreateError(err: unknown): MappedExpenseCreateError {
  const connectivityCodes = new Set<string>([
    CLIENT_ERROR_CODES.NETWORK_ERROR,
    CLIENT_ERROR_CODES.TIMEOUT,
    CLIENT_ERROR_CODES.CANCELLED,
  ]);

  if (err instanceof ApiError) {
    if (err.status >= 500) {
      return {
        titleKey: 'expenses.add.errorTitle',
        messageKey: 'expenses.add.errorServerAmbiguous',
      };
    }
    const messageKey =
      err.code === 'SPLIT_VALIDATION_ERROR'
        ? 'expenses.add.errorSplit'
        : 'expenses.add.errorGeneric';
    const detailText = err.details?.filter((d) => d.trim() !== '').join('\n') ?? '';

    let messagePlain: string | undefined;
    if (connectivityCodes.has(err.code)) {
      messagePlain = undefined;
    } else {
      const trimmedMsg = err.message.trim();
      messagePlain =
        detailText.trim() !== '' ? detailText.trim() : trimmedMsg !== '' ? trimmedMsg : undefined;
    }

    return {
      titleKey: 'expenses.add.errorTitle',
      messageKey,
      ...(messagePlain ? { messagePlain } : {}),
    };
  }

  if (err instanceof Error && err.message.trim() !== '') {
    return {
      titleKey: 'expenses.add.errorTitle',
      messageKey: 'expenses.add.errorGeneric',
      messagePlain: err.message.trim(),
    };
  }

  return {
    titleKey: 'expenses.add.errorTitle',
    messageKey: 'expenses.add.errorGeneric',
  };
}

export function isExpenseDeleteNotFound(err: unknown): boolean {
  if (!(err instanceof ApiError)) {
    return false;
  }
  return err.code === EXPENSE_DETAIL_ERROR_CODES.EXPENSE_NOT_FOUND || err.status === 404;
}

export function mapExpenseDeleteError(err: unknown): { titleKey: string; messageKey: string } {
  if (isExpenseDeleteNotFound(err)) {
    return {
      titleKey: 'expenses.delete.errorTitle',
      messageKey: 'expenses.delete.errorAlreadyDeleted',
    };
  }
  if (err instanceof ApiError) {
    return {
      titleKey: 'expenses.delete.errorTitle',
      messageKey: 'expenses.delete.errorGeneric',
    };
  }
  return {
    titleKey: 'expenses.delete.errorTitle',
    messageKey: 'expenses.delete.errorGeneric',
  };
}

export function isMockExpenseApi(): boolean {
  return MOCK_FLAG;
}
