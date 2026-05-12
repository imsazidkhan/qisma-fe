export const GROUP_MEMBER_ROLES = ['owner', 'admin', 'member'] as const;
export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];

export const GROUP_MEMBER_STATUSES = ['active', 'pending'] as const;
export type GroupMemberStatus = (typeof GROUP_MEMBER_STATUSES)[number];

/**
 * One row from `GET /v1/groups/:groupId/members` (and roster payloads on add/remove/role).
 */
export type GroupMemberRosterEntry = {
  id: string;
  avatar: string | null;
  name: string | null;
  username: string | null;
  role: GroupMemberRole;
  /** `pending` = invited; `active` = full member. Defaults to `active` when omitted by older APIs. */
  status: GroupMemberStatus;
  joinedAt: string | null;
  /** E.164 when the API includes it (e.g. for matching device / phone invites). */
  identifier?: string | null;
};
