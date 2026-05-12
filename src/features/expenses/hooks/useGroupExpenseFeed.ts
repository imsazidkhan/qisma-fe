import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchGroupExpenseFeedPage } from '@/features/expenses/api/groupExpenseFeedApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { GroupExpenseFeedFilters } from '@/features/expenses/types/groupExpenseFeed.types';
import { stableExpenseFeedFiltersKey } from '@/features/expenses/utils/stableExpenseFeedFiltersKey';
import { isUuid } from '@/features/groups/utils/isUuid';

export const DEFAULT_GROUP_EXPENSE_FEED_FILTERS: GroupExpenseFeedFilters = {};

export function useGroupExpenseFeed(
  groupId: string | undefined,
  filters: GroupExpenseFeedFilters,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && Boolean(groupId) && isUuid(groupId ?? '');
  const filterKey = stableExpenseFeedFiltersKey(filters);

  return useInfiniteQuery({
    queryKey: expensesQueryKeys.groupFeed(groupId ?? '', filterKey),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => {
      if (!groupId) {
        return Promise.reject(new Error('Missing groupId'));
      }
      return fetchGroupExpenseFeedPage(
        groupId,
        { filters, cursor: pageParam as string | undefined },
        signal,
      );
    },
    getNextPageParam: (last) => {
      if (!last.hasMore) return undefined;
      const c = last.nextCursor;
      if (c === null || c === undefined || c === '') return undefined;
      return c;
    },
  });
}
