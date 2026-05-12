import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import {
  parseExpenseDetail,
  type ExpenseDetail,
} from '@/features/expenses/types/expenseDetail.types';

export function parseExpenseDetailResponse(data: unknown): ExpenseDetail {
  try {
    return parseExpenseDetail(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid expense detail response shape.';
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message,
      status: 0,
    });
  }
}

export async function fetchExpenseDetail(
  expenseId: string,
  signal?: AbortSignal,
): Promise<ExpenseDetail> {
  const raw = await apiFetch<unknown>(ENDPOINTS.expenses.detail(expenseId), {
    method: 'GET',
    signal,
  });
  return parseExpenseDetailResponse(raw);
}
