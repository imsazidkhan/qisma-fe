import { router } from 'expo-router';
import { useCallback, useEffect, type ReactElement } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';

/** Stack screen nested under **`/home`** — edit `/v1/auth/me` profile fields. */
export default function EditProfileRoute(): ReactElement {
  const { accessToken } = useAuthSession();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.HOME);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      router.replace(ROUTES.LOGIN);
    }
  }, [accessToken]);

  return <EditProfileScreen onBack={handleBack} />;
}
