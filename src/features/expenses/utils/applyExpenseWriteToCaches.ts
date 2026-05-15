import type { QueryClient } from '@tanstack/react-query';

import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  CreateExpenseResponse,
  GroupBalancesSnapshot,
} from '@/features/expenses/types/expense.types';
import { groupBalancesSnapshotToListBalance } from '@/features/expenses/utils/groupBalancesSnapshotToListBalance';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';

export type ApplyExpenseWriteContext = {
  /**
   * Group id from the route / mutation when the API omits `expense.groupId` on the envelope
   * (otherwise feed invalidation never runs and the list stays stale).
   */
  routeGroupId?: string;
};

/** After create or PATCH expense — update my-groups balance row + schedule related refetches. */
export function applyExpenseWriteToCaches(
  queryClient: QueryClient,
  data: CreateExpenseResponse,
  currentUserId: string | undefined,
  context?: ApplyExpenseWriteContext,
): void {
  const expense = data.expense;
  const routeGid = context?.routeGroupId?.trim();
  const groupId = expense?.groupId?.trim() || routeGid;
  if (!groupId) {
    return;
  }
  const snapshot: GroupBalancesSnapshot = {
    netByUserId: data.groupBalances?.netByUserId ?? {},
    edges: data.groupBalances?.edges ?? [],
  };
  const currency = expense?.currency?.trim() || snapshot.edges?.[0]?.currency?.trim() || 'INR';
  const balance = groupBalancesSnapshotToListBalance(snapshot, currentUserId, currency);

  queryClient.setQueryData<GroupListItem[]>(groupsQueryKeys.myGroups, (previous) => {
    if (!previous) {
      return previous;
    }
    return previous.map((row) => (row.id === groupId ? { ...row, balance } : row));
  });

  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.memberProfile(groupId) });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.balancesPrefix(groupId) });
  void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.groupFeedScope(groupId) });
  void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.analytics(groupId) });
}
