export const groupsQueryKeys = {
  root: ['groups'] as const,
  /** `GET /v1/users/me/groups` — signed-in user's membership list (home + groups tab). */
  myGroups: ['groups', 'my'] as const,
  /** `GET /v1/users/me/groups/home` — tabbed dashboard; prefix still `['groups','my']` for invalidation. */
  myGroupsHome: (tab: string) => ['groups', 'my', 'home', tab] as const,
  /** `GET /v1/groups` — creator-owned list (optional product surface). */
  createdList: ['groups', 'created'] as const,
  /** `GET /v1/groups/:id` — creator-only cache (optional). */
  creatorDetail: (groupId: string) => ['groups', 'creatorDetail', groupId] as const,
  /** `GET /v1/groups/:id/member-profile` — active member metadata. */
  memberProfile: (groupId: string) => ['groups', 'memberProfile', groupId] as const,
  /** `GET /v1/groups/:id/invite-preview` — pending invitee preview. */
  invitePreview: (groupId: string) => ['groups', 'invitePreview', groupId] as const,
  /** `GET /v1/groups/:groupId/members` */
  members: (groupId: string) => ['groups', 'members', groupId] as const,
  /** `GET /v1/groups/:groupId/activity` — membership / invite events */
  groupActivity: (groupId: string) => ['groups', 'activity', groupId] as const,
  /** Prefix for invalidating all viewer variants of group balances. */
  balancesPrefix: (groupId: string) => ['groups', 'balances', groupId] as const,
  /** `GET /v1/groups/:groupId/balances` — include viewer id so ledger rows remap after auth resolves. */
  balances: (groupId: string, viewerUserId?: string) =>
    ['groups', 'balances', groupId, viewerUserId ?? '__pending'] as const,
  /** Invalidate all `GET …/analytics/*` queries for a group. */
  analytics: (groupId: string) => ['groups', 'analytics', groupId] as const,
  analyticsSegment: (groupId: string, segment: string, queryKey: string) =>
    ['groups', 'analytics', groupId, segment, queryKey] as const,
} as const;
