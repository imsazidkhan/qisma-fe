import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateProfile } from '@/features/auth/api/authApi';
import { useAuthMe, useAuthSession } from '@/features/auth/hooks';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { getWelcomeDisplayNameFromAccessToken } from '@/features/auth/services/welcomeDisplayName';
import { GroupsHomeInitialLoading, useGroupsList } from '@/features/groups';
import { HomeDashboardScreen } from '@/features/home/components/HomeDashboardScreen';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';

/**
 * Home tab — balance summary, quick actions, and a short groups preview.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthSession();
  const { data: me } = useAuthMe();
  const {
    data: groupsData,
    isPending: groupsPending,
    isError: groupsError,
    refetch: refetchGroups,
  } = useGroupsList();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  /** Legacy rows: profile fields populated but `onboardingCompletedAt` never set — align with server once. */
  const repairEnrollment = useRef(false);
  useEffect(() => {
    if (!accessToken || !me?.onboarding) {
      return;
    }
    const o = me.onboarding;
    if (o.isOnboardingComplete === true) {
      repairEnrollment.current = false;
      return;
    }
    if (!o.hasDisplayName || !o.hasAvatar || !Boolean(o.hasUseCase)) {
      return;
    }
    if (repairEnrollment.current) return;
    repairEnrollment.current = true;
    void updateProfile({ onboardingCompleted: true })
      .then((profile) => {
        setAuthMeCacheFromPatch(queryClient, profile);
      })
      .catch(() => {
        repairEnrollment.current = false;
      });
  }, [accessToken, me?.onboarding, queryClient]);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  const displayName = useMemo(() => {
    const fromApi = me?.name?.trim();
    if (fromApi) return fromApi;
    if (accessToken) return getWelcomeDisplayNameFromAccessToken(accessToken);
    return null;
  }, [accessToken, me?.name]);

  const scrollBottomPadding = getQismaTabBarContentInset(insets.bottom);

  const groups = groupsData ?? [];
  const showGroupsLoader = groupsPending && accessToken;

  const handleExpensePress = useCallback(() => {
    Alert.alert(t('homeDashboard.expenseSoonTitle'), t('homeDashboard.expenseSoonBody'));
  }, [t]);

  if (showGroupsLoader) {
    return <GroupsHomeInitialLoading scrollBottomPadding={scrollBottomPadding} />;
  }

  return (
    <HomeDashboardScreen
      displayName={displayName}
      groups={groups}
      isGroupsError={groupsError}
      onRetryGroups={() => void refetchGroups()}
      refetchGroupsList={() => refetchGroups()}
      onExpensePress={handleExpensePress}
      scrollBottomPadding={scrollBottomPadding}
    />
  );
}
