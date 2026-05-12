import { useQuery } from '@tanstack/react-query';

import { fetchGroupBalancesSnapshot } from '@/features/groups/api/groupBalancesApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';

export type UseGroupBalancesSnapshotOptions = {
  enabled: boolean;
};

/**
 * `GET /v1/groups/:groupId/balances` — viewer-centric settlement summary for the group hub.
 */
export function useGroupBalancesSnapshot(
  groupId: string | undefined,
  options: UseGroupBalancesSnapshotOptions,
) {
  const { enabled } = options;

  return useQuery({
    queryKey: groupId ? groupsQueryKeys.balances(groupId) : ['groups', 'balances', '__disabled'],
    queryFn: ({ signal }) => fetchGroupBalancesSnapshot(groupId!, signal),
    enabled: Boolean(groupId) && enabled,
    staleTime: 30_000,
  });
}
