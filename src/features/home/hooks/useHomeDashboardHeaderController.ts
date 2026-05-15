import { ROUTES } from '@/constants/routes';
import type { HomeDashboardHeaderProps } from '@/features/home/components/HomeDashboardHeader';
import { useHomeDashboardHeaderCopy } from '@/features/home/hooks/useHomeDashboardHeaderCopy';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type HomeDashboardHeaderController = {
  headerProps: HomeDashboardHeaderProps;
  inviteBadgeCount: number;
  refetchInvitesInbox: () => Promise<unknown>;
};

/** Shared header block for Home / Groups / Activity / Insights tabs — keeps stamp, actions, and inbox dot in sync. */
export function useHomeDashboardHeaderController(): HomeDashboardHeaderController {
  const { t } = useTranslation();
  const { stamp } = useHomeDashboardHeaderCopy();
  const { data: inviteInbox, refetch: refetchInvitesInbox } = useGroupInvitesInbox();
  const inviteBadgeCount = inviteInbox?.length ?? 0;

  const inboxAccessibilityLabel = useMemo(() => {
    if (inviteBadgeCount <= 0) {
      return t('homeDashboard.inboxA11y');
    }
    return `${t('homeDashboard.inboxA11y')}, ${t('homeDashboard.inboxBadge', { count: inviteBadgeCount })}`;
  }, [inviteBadgeCount, t]);

  const handleOpenInbox = useCallback(() => {
    router.push(ROUTES.HOME_INVITES);
  }, []);

  const handleOpenProfile = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push('/home/profile');
  }, []);

  const headerProps = useMemo(
    (): HomeDashboardHeaderProps => ({
      stamp,
      inviteBadgeCount,
      profileAccessibilityLabel: t('homeDashboard.profileTabA11y'),
      profileAccessibilityHint: t('home.profileHint'),
      inboxAccessibilityLabel,
      inboxAccessibilityHint: t('homeDashboard.inboxHint'),
      onProfilePress: handleOpenProfile,
      onInboxPress: handleOpenInbox,
    }),
    [stamp, inviteBadgeCount, inboxAccessibilityLabel, t, handleOpenProfile, handleOpenInbox],
  );

  return {
    headerProps,
    inviteBadgeCount,
    refetchInvitesInbox,
  };
}
