import type { GroupListItem } from '@/features/groups/types/groupsList.types';

/** `tab` query + response echo for `GET /v1/users/me/groups/home`. */
export type GroupsHomeTabQuery = 'all' | 'owe' | 'get_back' | 'settled';

/** Unwrapped `data` shape from the home groups envelope. */
export type GroupsHomeData = {
  tab: GroupsHomeTabQuery;
  items: GroupListItem[];
};
