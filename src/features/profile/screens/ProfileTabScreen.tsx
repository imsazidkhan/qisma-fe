import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks';
import { ProfileScreenView } from '@/features/profile/components/ProfileScreenView';

/** Tab route: premium profile + preferences + sign out. */
export function ProfileTabScreen(): ReactElement {
  const { signOut } = useAuthSession();

  const handleSignOut = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await signOut();
    router.replace(ROUTES.LOGIN);
  }, [signOut]);

  return <ProfileScreenView onSignOut={handleSignOut} />;
}
