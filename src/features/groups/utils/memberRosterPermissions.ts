import type {
  GroupMemberRosterEntry,
  GroupMemberRole,
} from '@/features/groups/types/groupMember.types';

export function findActorRole(
  roster: GroupMemberRosterEntry[],
  userId: string | undefined,
): GroupMemberRole | null {
  if (!userId) return null;
  const row = roster.find((r) => r.id === userId && r.status === 'active');
  return row?.role ?? null;
}

/**
 * Whether the **Remove** control may be shown for `target` given the signed-in actor.
 * Self-pending invitees use **Decline** instead of Remove.
 */
export function canShowRemoveMemberControl(params: {
  actorUserId: string | undefined;
  actorRole: GroupMemberRole | null;
  target: GroupMemberRosterEntry;
}): boolean {
  const { actorUserId, actorRole, target } = params;

  if (target.role === 'owner') return false;

  if (target.status === 'pending' && target.id === actorUserId) return false;

  if (!actorRole || actorRole === 'member') return false;

  if (actorRole === 'owner') {
    return target.role === 'admin' || target.role === 'member';
  }

  // admin
  if (target.id === actorUserId) return true;
  if (target.role === 'member') return true;
  return false;
}

export function canShowSelfInviteActions(params: {
  actorUserId: string | undefined;
  target: GroupMemberRosterEntry;
}): boolean {
  const { actorUserId, target } = params;
  return Boolean(actorUserId) && target.id === actorUserId && target.status === 'pending';
}

/**
 * Owner may change **admin** ↔ **member** only for **active** non-owners.
 */
export function canShowOwnerRoleControl(params: {
  actorRole: GroupMemberRole | null;
  target: GroupMemberRosterEntry;
}): boolean {
  const { actorRole, target } = params;
  if (actorRole !== 'owner') return false;
  if (target.role === 'owner') return false;
  return target.status === 'active';
}
