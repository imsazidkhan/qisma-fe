import type { GroupTypeId } from '@/features/groups/constants/groupTypes';

/**
 * One row from `GET /v1/users/me/groups` (`data[]`).
 * Aligns with backend `MyGroupRowDto`.
 */
export type MyGroupWireGroup = {
  id: string;
  name: string;
  type: GroupTypeId;
  avatar: string | null;
};

export type MyGroupRowDto = {
  group: MyGroupWireGroup;
  role: string;
  joinedAt: string;
  isCreator: boolean;
};
