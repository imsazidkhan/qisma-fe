import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { fetchExpenseDetail } from '@/features/expenses/api/expenseDetailApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

export type UseExpenseDetailOptions = {
  enabled?: boolean;
};

export function useExpenseDetail(
  expenseId: string | undefined,
  options?: UseExpenseDetailOptions,
): UseQueryResult<ExpenseDetail, Error> {
  const enabled = Boolean(expenseId) && (options?.enabled ?? true);

  return useQuery({
    queryKey: expensesQueryKeys.detail(expenseId ?? ''),
    queryFn: ({ signal }) => fetchExpenseDetail(expenseId as string, signal),
    enabled,
  });
}
