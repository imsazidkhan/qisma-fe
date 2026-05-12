import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/api';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getGroupInvitePreview, getGroupMemberProfile } from '@/features/groups/api/groupsApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { Group } from '@/features/groups/types/group.types';
import { isUuid } from '@/features/groups/utils/isUuid';

const detailRetry = (failureCount: number, error: Error): boolean => {
  if (error instanceof ApiError && error.code === 'GROUP_NOT_FOUND') {
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

export type GroupRouteDetailMode = 'memberProfile' | 'invitePreview';

/**
 * Group metadata for a route: **member profile** (active member) or **invite preview** (pending).
 */
export function useGroupRouteDetail(groupId: string | undefined, mode: GroupRouteDetailMode) {
  const { accessToken } = useAuthSession();
  const id = groupId?.trim() ?? '';
  const valid = isUuid(id);

  const queryKey =
    mode === 'memberProfile'
      ? groupsQueryKeys.memberProfile(id)
      : groupsQueryKeys.invitePreview(id);

  return useQuery<Group, Error>({
    queryKey,
    queryFn: ({ signal }) =>
      mode === 'memberProfile'
        ? getGroupMemberProfile(id, signal)
        : getGroupInvitePreview(id, signal),
    enabled: Boolean(accessToken) && valid,
    staleTime: 15_000,
    retry: detailRetry,
  });
}

/**
 * `GET /v1/groups/:id/member-profile` — active member metadata (group detail + members screen).
 */
export function useGroupMemberProfile(groupId: string | undefined) {
  return useGroupRouteDetail(groupId, 'memberProfile');
}

/**
 * Same as {@link useGroupMemberProfile} — historical name for the membership detail endpoint.
 */
export function useGroupDetail(groupId: string | undefined) {
  return useGroupMemberProfile(groupId);
}
