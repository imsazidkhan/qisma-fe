import type { GroupTypeId } from '@/features/groups/constants/groupTypes';

/** List row — home feed from `GET /v1/users/me/groups`, or legacy mappers. */
export type GroupListItem = {
  id: string;
  name: string;
  iconEmoji: string;
  /** Hub kind label (trip, home, …) — drives roster meta line on financial cards. */
  groupType?: GroupTypeId;
  /** When set, list rows may show an avatar image instead of the type emoji. */
  avatarUrl?: string | null;
  memberCount: number;
  lastActivityAt: string;
  balance: {
    tone: 'owed_to_you' | 'you_owe' | 'settled';
    amountMinor: number;
    currency: string;
  };
  /** Set from `GET /v1/users/me/groups`; optional when row is mapped from flat `Group` only. */
  role?: string;
  joinedAt?: string;
  isCreator?: boolean;
};
