import { router } from 'expo-router';
import { useEffect, type ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '@/features/auth/hooks';
import { ActivityFeedScreen } from '@/features/activity';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';

/** Activity feed: invites, new hubs, and memberships. */
export default function HomeActivityTabScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const bottom = getQismaTabBarContentInset(insets.bottom);
  const { accessToken } = useAuthSession();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  return <ActivityFeedScreen contentPaddingBottom={bottom} />;
}
