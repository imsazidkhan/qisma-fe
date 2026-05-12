import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { z } from 'zod';
import {
  expenseCategoryListSchema,
  type ExpenseCategoryListItem,
} from '@/features/expenses/types/expenseTaxonomy.types';

const reclassifyResponseSchema = z.object({ ok: z.literal(true) });

export type ReclassifyExpenseBody = {
  categorySlug: string;
  subcategorySlug?: string;
};

export async function fetchExpenseCategories(
  signal?: AbortSignal,
): Promise<ExpenseCategoryListItem[]> {
  const raw = await apiFetch<unknown>(ENDPOINTS.categories.list, {
    method: 'GET',
    signal,
  });
  const parsed = expenseCategoryListSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid categories response shape.',
      status: 0,
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  return parsed.data;
}

export async function reclassifyExpense(
  expenseId: string,
  body: ReclassifyExpenseBody,
  signal?: AbortSignal,
): Promise<{ ok: true }> {
  const raw = await apiFetch<unknown>(ENDPOINTS.expenses.reclassify(expenseId), {
    method: 'POST',
    body,
    signal,
  });
  const parsed = reclassifyResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid reclassify response shape.',
      status: 0,
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  return parsed.data;
}
