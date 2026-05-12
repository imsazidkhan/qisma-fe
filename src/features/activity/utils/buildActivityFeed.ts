import { GROUP_TYPE_EMOJI, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';

import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';

function parseSortKey(iso: string | null | undefined): number {
  if (iso == null) return 0;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Builds a single timeline from inbox invites and my-group membership rows.
 *
 * - **invite** — pending inbox item (`GET /v1/users/me/group-invites`).
 * - **join** — you created the hub (`isCreator` on `GET /v1/users/me/groups`).
 * - **accept** — you're a member but not the creator (joined / accepted membership).
 */
export function buildActivityFeed(
  groups: readonly GroupListItem[],
  invites: readonly GroupInviteInboxItem[],
): ActivityFeedItem[] {
  const out: ActivityFeedItem[] = [];

  for (const g of groups) {
    const at = g.joinedAt?.trim() || g.lastActivityAt?.trim();
    if (!at) continue;
    const isCreator = Boolean(g.isCreator);
    const kind: 'join' | 'accept' = isCreator ? 'join' : 'accept';
    out.push({
      kind,
      feedItemId: `${kind}-${g.id}`,
      groupId: g.id,
      groupName: g.name,
      at,
      avatarUrl: g.avatarUrl,
      iconEmoji: g.iconEmoji,
    });
  }

  for (const item of invites) {
    const type: GroupTypeId = item.groupType ?? 'other';
    const iconEmoji = GROUP_TYPE_EMOJI[type];
    const groupName = item.name?.trim() ?? '';
    out.push({
      kind: 'invite',
      feedItemId: `invite-${item.groupId}`,
      groupId: item.groupId,
      groupName,
      invitedByName: item.invitedByName,
      invitedAt: item.invitedAt,
      avatarUrl: item.avatarUrl,
      iconEmoji,
    });
  }

  return out.sort((a, b) => {
    const ka = a.kind === 'invite' ? parseSortKey(a.invitedAt) : parseSortKey(a.at);
    const kb = b.kind === 'invite' ? parseSortKey(b.invitedAt) : parseSortKey(b.at);
    return kb - ka;
  });
}
