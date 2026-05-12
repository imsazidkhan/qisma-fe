import type { QueryClient } from '@tanstack/react-query';

import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { CreateExpenseResponse } from '@/features/expenses/types/expense.types';
import { groupBalancesSnapshotToListBalance } from '@/features/expenses/utils/groupBalancesSnapshotToListBalance';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';

/** After create or PATCH expense — update my-groups balance row + schedule related refetches. */
export function applyExpenseWriteToCaches(
  queryClient: QueryClient,
  data: CreateExpenseResponse,
  currentUserId: string | undefined,
): void {
  const groupId = data.expense.groupId;
  const currency =
    data.expense.currency?.trim() || data.groupBalances.edges[0]?.currency?.trim() || 'INR';
  const balance = groupBalancesSnapshotToListBalance(data.groupBalances, currentUserId, currency);

  queryClient.setQueryData<GroupListItem[]>(groupsQueryKeys.myGroups, (previous) => {
    if (!previous) {
      return previous;
    }
    return previous.map((row) => (row.id === groupId ? { ...row, balance } : row));
  });

  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.memberProfile(groupId) });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.balances(groupId) });
  void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.groupFeedScope(groupId) });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.analytics(groupId) });
}
