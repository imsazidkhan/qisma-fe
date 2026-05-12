import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';

import { buildActivityFeed } from '@/features/activity/utils/buildActivityFeed';
import { useGroupsList } from '@/features/groups/hooks/useGroupsList';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';

import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';

export type UseActivityFeedResult = {
  items: ActivityFeedItem[];
  refetchAll: () => void;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isFatalError: boolean;
};

export function useActivityFeed(): UseActivityFeedResult {
  const groupsQuery = useGroupsList();
  const invitesQuery = useGroupInvitesInbox();

  const items = useMemo(
    () => buildActivityFeed(groupsQuery.data ?? [], invitesQuery.data ?? []),
    [groupsQuery.data, invitesQuery.data],
  );

  const refetchGroups = groupsQuery.refetch;
  const refetchInvites = invitesQuery.refetch;

  const refetchAll = useCallback(() => {
    void Promise.all([refetchGroups(), refetchInvites()]);
  }, [refetchGroups, refetchInvites]);

  useFocusEffect(
    useCallback(() => {
      refetchAll();
    }, [refetchAll]),
  );

  const hasAnyData = groupsQuery.data !== undefined || invitesQuery.data !== undefined;
  const isInitialLoading = !hasAnyData && (groupsQuery.isPending || invitesQuery.isPending);

  const isRefreshing = groupsQuery.isFetching || invitesQuery.isFetching;
  const isFatalError =
    groupsQuery.isError &&
    invitesQuery.isError &&
    groupsQuery.data === undefined &&
    invitesQuery.data === undefined;

  return {
    items,
    refetchAll,
    isInitialLoading,
    isRefreshing,
    isFatalError,
  };
}
