import { GROUP_TYPE_EMOJI } from '@/features/groups/constants/groupTypes';
import type { Group } from '@/features/groups/types/group.types';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';

/** Map API `Group` → list row. Parent feed is **`GET /v1/groups`** (membership). */
export function groupToListItem(g: Group): GroupListItem {
  return {
    id: g.id,
    name: g.name,
    iconEmoji: GROUP_TYPE_EMOJI[g.type],
    groupType: g.type,
    avatarUrl: g.avatar,
    memberCount: 0,
    lastActivityAt: g.updatedAt,
    balance: {
      tone: 'settled',
      amountMinor: 0,
      currency: 'INR',
    },
  };
}
