import type { GroupTypeId } from '@/features/groups/constants/groupTypes';

/**
 * Inviter summary on `GET /v1/users/me/group-invites` items
 * (`PendingGroupInviteEntryDto.invitedBy`).
 */
export type PendingGroupInviteInviterDto = {
  userId: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
};

/**
 * One row from `GET /v1/users/me/group-invites` — **`group_members.status === "pending"`**
 * for registered users only (not `group_invites` TTL rows for unknown phones).
 *
 * Generate / refresh from OpenAPI when the backend schema drifts.
 */
export type PendingGroupInviteEntryDto = {
  groupId: string;
  groupName: string;
  groupAvatar: string | null;
  groupType: string;
  role: string;
  invitedAt: string;
  invitedBy: PendingGroupInviteInviterDto | null;
};

/**
 * Normalised inbox item for UI (maps wire aliases and nullable fields).
 */
export type GroupInviteInboxItem = {
  groupId: string;
  /** Group display name (`groupName` on wire). */
  name: string | null;
  invitedAt: string | null;
  /** Resolved display string for “X invited you” (name or @username). */
  invitedByName: string | null;
  /** Inviter profile when the API sends `invitedBy`. */
  invitedBy: PendingGroupInviteInviterDto | null;
  /** Target role for this invite when provided. */
  role: string | null;
  /** Active member count when the API includes it (optional on contract). */
  memberCount: number | null;
  groupType: GroupTypeId | null;
  avatarUrl: string | null;
};
