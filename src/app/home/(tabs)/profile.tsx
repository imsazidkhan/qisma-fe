import { router } from 'expo-router';
import { useEffect, type ReactElement } from 'react';

import { useAuthSession } from '@/features/auth/hooks';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { ProfileTabScreen } from '@/features/profile';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';

/** Profile / account tab — appearance + sign out. */
export default function HomeProfileTabRoute(): ReactElement {
  const { accessToken } = useAuthSession();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  return <ProfileTabScreen />;
}
