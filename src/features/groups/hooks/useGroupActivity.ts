import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/api';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { fetchGroupActivity } from '@/features/groups/api/groupActivityApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { isUuid } from '@/features/groups/utils/isUuid';

const groupActivityRetry = (failureCount: number, error: Error): boolean => {
  if (error instanceof ApiError && error.code === 'GROUP_NOT_FOUND') {
    return false;
  }
  if (error instanceof ApiError && error.code === 'USER_NOT_FOUND') {
    return false;
  }
  if (error instanceof ApiError && error.code === 'NOT_GROUP_MEMBER') {
    return false;
  }
  if (error instanceof ApiError && error.status === 404) {
    return false;
  }
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
};

export function useGroupActivity(groupId: string | undefined, enabled: boolean = true) {
  const { accessToken } = useAuthSession();
  const id = groupId?.trim() ?? '';
  const valid = isUuid(id);

  return useQuery({
    queryKey: groupsQueryKeys.groupActivity(id),
    queryFn: ({ signal }) => fetchGroupActivity(id, signal),
    enabled: Boolean(accessToken) && valid && enabled,
    staleTime: 30_000,
    retry: groupActivityRetry,
  });
}
