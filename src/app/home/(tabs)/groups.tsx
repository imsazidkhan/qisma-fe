import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hrefGroupDetail } from '@/constants/routes';

import { useAuthSession } from '@/features/auth/hooks';
import {
  type GroupsHomeTabQuery,
  GroupsHomeInitialLoading,
  GroupsListHome,
  useGroupsHome,
} from '@/features/groups';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';

/** Full groups list + search (tab). */
export default function HomeGroupsTabScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthSession();
  const [homeTab, setHomeTab] = useState<GroupsHomeTabQuery>('all');
  const {
    data: homeData,
    isPending: homePending,
    isError: homeError,
    isFetching: homeFetching,
    refetch: refetchHome,
  } = useGroupsHome(homeTab);

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  const scrollBottomPadding = getQismaTabBarContentInset(insets.bottom);

  const onRefreshGroups = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['groups', 'my'] });
    void refetchHome();
  }, [queryClient, refetchHome]);

  const groups = homeData?.items ?? [];
  const showLoader = homePending && !homeData && accessToken;

  const onGroupPress = useCallback((groupId: string) => {
    router.push(hrefGroupDetail(groupId));
  }, []);

  if (showLoader) {
    return <GroupsHomeInitialLoading scrollBottomPadding={scrollBottomPadding} />;
  }

  return (
    <GroupsListHome
      groups={groups}
      homeTab={homeTab}
      onHomeTabChange={setHomeTab}
      isFetching={homeFetching}
      isError={homeError}
      onRetry={() => void refetchHome()}
      onRefresh={onRefreshGroups}
      scrollBottomPadding={scrollBottomPadding}
      onGroupPress={onGroupPress}
    />
  );
}
