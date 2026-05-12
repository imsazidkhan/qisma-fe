import type { GroupTypeId } from '@/features/groups/constants/groupTypes';

/**
 * Veloraq **`GET/POST /v1/groups`** wire shape (`data` after envelope unwrap).
 */
export type Group = {
  id: string;
  name: string;
  type: GroupTypeId;
  avatar: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * `GET …/invite-preview` only: **active** member count (server excludes pending rows).
   */
  memberCount?: number | null;
};
