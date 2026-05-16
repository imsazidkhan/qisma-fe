import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks';
import { ProfileScreenView } from '@/features/profile/components/ProfileScreenView';

/** Tab route: premium profile + preferences + sign out. */
export function ProfileTabScreen(): ReactElement {
  const { t } = useTranslation();
  const { signOut } = useAuthSession();

  const runSignOut = useCallback(async (): Promise<void> => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await signOut();
    router.replace(ROUTES.LOGIN);
  }, [signOut]);

  const handleSignOutPrompt = useCallback(() => {
    Alert.alert(t('profile.signOutConfirmTitle'), t('profile.signOutConfirmBody'), [
      {
        text: t('profile.signOutConfirmCancel'),
        style: 'cancel',
      },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: () => void runSignOut(),
      },
    ]);
  }, [runSignOut, t]);

  return <ProfileScreenView onSignOut={handleSignOutPrompt} />;
}
