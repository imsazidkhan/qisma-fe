import type { TFunction } from 'i18next';

import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';
import { formatGroupTimestamp } from '@/features/groups/utils/formatGroupTimestamp';

export type ActivityFeedItemDisplay = {
  kindLabel: string;
  title: string;
  meta: string;
  a11yLabel: string;
};

export function getActivityFeedItemDisplay(
  item: ActivityFeedItem,
  t: TFunction,
): ActivityFeedItemDisplay {
  const kindLabel =
    item.kind === 'invite'
      ? t('activityFeed.kindInvite')
      : item.kind === 'join'
        ? t('activityFeed.kindJoin')
        : t('activityFeed.kindAccept');

  let title: string;
  if (item.kind === 'invite') {
    const name = item.groupName.trim() ? item.groupName : t('activityFeed.unknownGroup');
    title = name;
  } else if (item.kind === 'join') {
    title = t('activityFeed.joinBody', { name: item.groupName });
  } else {
    title = t('activityFeed.acceptBody', { name: item.groupName });
  }

  let meta: string;
  if (item.kind !== 'invite') {
    meta = t('activityFeed.timeMeta', {
      relative: formatGroupTimestamp(item.at, t),
    });
  } else {
    const inviter = item.invitedByName?.trim() || t('invites.someoneInvited');
    const inviterLine = t('invites.invitedByLine', { name: inviter });
    const invitedAt = item.invitedAt?.trim();
    if (!invitedAt) {
      meta = inviterLine;
    } else {
      const relative = formatGroupTimestamp(invitedAt, t);
      meta = `${inviterLine} · ${t('invites.invitedRelative', { relative })}`;
    }
  }

  const a11yLabel =
    item.kind === 'invite'
      ? t('activityFeed.rowOpenInviteA11y', { name: title })
      : t('activityFeed.rowOpenGroupA11y', { name: item.groupName });

  return { kindLabel, title, meta, a11yLabel };
}
