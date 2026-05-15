import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { fetchExpenseDetail } from '@/features/expenses/api/expenseDetailApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

export type UseExpenseDetailOptions = {
  enabled?: boolean;
};

export function useExpenseDetail(
  groupId: string | undefined,
  expenseId: string | undefined,
  options?: UseExpenseDetailOptions,
): UseQueryResult<ExpenseDetail, Error> {
  const gid = groupId?.trim() ?? '';
  const eid = expenseId?.trim() ?? '';
  const baseEnabled = gid.length > 0 && eid.length > 0;
  const enabled = baseEnabled && (options?.enabled ?? true);

  return useQuery({
    queryKey: expensesQueryKeys.detail(gid, eid),
    queryFn: ({ signal }) => fetchExpenseDetail(gid, eid, signal),
    enabled,
  });
}
