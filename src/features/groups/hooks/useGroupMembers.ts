import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api';
import {
  acceptGroupInvite,
  addGroupMember,
  declineGroupInvite,
  getGroupMembers,
  removeGroupMember,
  updateGroupMemberRole,
  type AddGroupMemberBody,
  type UpdateGroupMemberRoleBody,
} from '@/features/groups/api/groupMembersApi';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { invitesQueryKeys } from '@/features/invites/queryKeys';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';

export type UseGroupMembersOptions = {
  /** When `false`, skips roster fetch (e.g. pending invitee — `GET …/members` returns 403). */
  enabled?: boolean;
};

/**
 * `GET /v1/groups/:groupId/members` — server requires an **active** member; response may include pending rows.
 */
export function useGroupMembers(groupId: string | undefined, options?: UseGroupMembersOptions) {
  const { accessToken } = useAuthSession();
  const id = groupId?.trim() ?? '';
  const valid = isUuid(id);
  const rosterEnabled = options?.enabled !== false;

  return useQuery<GroupMemberRosterEntry[], Error>({
    queryKey: groupsQueryKeys.members(id),
    queryFn: ({ signal }) => getGroupMembers(id, signal),
    enabled: Boolean(accessToken) && valid && rosterEnabled,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === 'GROUP_NOT_FOUND') {
        return false;
      }
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * `POST /v1/groups/:groupId/members` — add / invite (`identifier` | `username` | `userId`).
 * On success, seeds the roster cache from `data` and invalidates related queries so hubs and lists stay in sync.
 */
export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMemberRosterEntry[], Error, AddGroupMemberBody>({
    mutationFn: (body) => addGroupMember(groupId, body),
    onSuccess: (roster) => {
      queryClient.setQueryData(groupsQueryKeys.members(groupId), roster);
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.memberProfile(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.groupActivity(groupId) });
      void queryClient.invalidateQueries({ queryKey: invitesQueryKeys.root });
    },
  });
}

/**
 * `DELETE .../members/:memberId` — updates members cache from response, then refetches roster subscribers.
 */
export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMemberRosterEntry[], Error, string>({
    mutationFn: (memberId) => removeGroupMember(groupId, memberId),
    onSuccess: (roster) => {
      queryClient.setQueryData(groupsQueryKeys.members(groupId), roster);
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.groupActivity(groupId) });
    },
  });
}

/**
 * `POST .../invites/accept` — replaces roster when API returns an array; otherwise refetches.
 */
export function useAcceptGroupInvite(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMemberRosterEntry[] | null, Error, void>({
    mutationFn: () => acceptGroupInvite(groupId),
    onSuccess: (roster) => {
      if (roster) {
        queryClient.setQueryData(groupsQueryKeys.members(groupId), roster);
      }
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
      void queryClient.invalidateQueries({ queryKey: invitesQueryKeys.root });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.invitePreview(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.memberProfile(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.groupActivity(groupId) });
    },
  });
}

/**
 * `POST .../invites/decline` — refetch roster (invitee drops off).
 */
export function useDeclineGroupInvite(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ groupId: string } | null, Error, void>({
    mutationFn: () => declineGroupInvite(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
      void queryClient.invalidateQueries({ queryKey: invitesQueryKeys.root });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.invitePreview(groupId) });
    },
  });
}

/**
 * `PATCH .../members/:memberId/role` — owner-only; updates roster from response, then refetches subscribers.
 */
export function useUpdateGroupMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    GroupMemberRosterEntry[],
    Error,
    { memberId: string; body: UpdateGroupMemberRoleBody }
  >({
    mutationFn: ({ memberId, body }) => updateGroupMemberRole(groupId, memberId, body),
    onSuccess: (roster) => {
      queryClient.setQueryData(groupsQueryKeys.members(groupId), roster);
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupId) });
    },
  });
}
