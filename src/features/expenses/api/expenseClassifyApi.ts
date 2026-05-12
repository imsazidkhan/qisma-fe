import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import {
  expenseClassifyResponseSchema,
  type ExpenseClassifyResponse,
} from '@/features/expenses/types/expenseTaxonomy.types';

export async function classifyExpenseTitle(
  title: string,
  signal?: AbortSignal,
): Promise<ExpenseClassifyResponse> {
  const raw = await apiFetch<unknown>(ENDPOINTS.expenses.classify, {
    method: 'POST',
    body: { title },
    signal,
  });
  const parsed = expenseClassifyResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid classify response shape.',
      status: 0,
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  return parsed.data;
}
