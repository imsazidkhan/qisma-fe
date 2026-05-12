import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hrefGroupDetail, ROUTES } from '@/constants/routes';

import { useAuthSession } from '@/features/auth/hooks';
import {
  GroupsHomeInitialLoading,
  GroupsListHome,
  groupsQueryKeys,
  useGroupsList,
} from '@/features/groups';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';

/** Full groups list + search (tab). */
export default function HomeGroupsTabScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthSession();
  const {
    data: groupsData,
    isPending: groupsPending,
    isError: groupsError,
    isFetching: groupsFetching,
    refetch: refetchGroups,
  } = useGroupsList();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  const scrollBottomPadding = getQismaTabBarContentInset(insets.bottom);

  const onRefreshGroups = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
  }, [queryClient]);

  const groups = groupsData ?? [];
  const showLoader = groupsPending && accessToken;

  const onHomeBack = useCallback(() => {
    router.navigate(ROUTES.HOME);
  }, []);

  const onGroupPress = useCallback((groupId: string) => {
    router.push(hrefGroupDetail(groupId));
  }, []);

  if (showLoader) {
    return <GroupsHomeInitialLoading scrollBottomPadding={scrollBottomPadding} />;
  }

  return (
    <GroupsListHome
      groups={groups}
      isFetching={groupsFetching}
      isError={groupsError}
      onRetry={() => void refetchGroups()}
      onRefresh={onRefreshGroups}
      scrollBottomPadding={scrollBottomPadding}
      onGroupPress={onGroupPress}
      onHomeBackPress={onHomeBack}
    />
  );
}
