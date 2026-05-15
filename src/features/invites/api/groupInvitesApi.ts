import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { GROUP_TYPE_ORDER, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import {
  GROUP_MEMBER_ROLES,
  type GroupMemberRole,
} from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';

import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';
import type { PendingGroupInviteInviterDto } from '@/features/invites/types/pendingGroupInvite.types';

const nullableString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => v ?? null);

function parseOptionalGroupType(raw: string | null): GroupTypeId | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return (GROUP_TYPE_ORDER as readonly string[]).includes(v) ? (v as GroupTypeId) : null;
}

const invitedBySchema = z.union([
  z.null(),
  z
    .object({
      userId: z.union([z.string(), z.null()]).optional(),
      name: nullableString,
      username: nullableString,
      avatar: nullableString,
    })
    .passthrough(),
]);

const inboxItemSchema = z
  .object({
    groupId: z.string().uuid(),
    name: nullableString,
    groupName: nullableString,
    invitedAt: nullableString,
    invitedByName: nullableString,
    inviterName: nullableString,
    role: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v): GroupMemberRole | null => {
        if (v == null || typeof v !== 'string') return null;
        const r = v.trim().toLowerCase();
        return (GROUP_MEMBER_ROLES as readonly string[]).includes(r)
          ? (r as GroupMemberRole)
          : null;
      }),
    memberCount: z
      .union([z.number(), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === null) return null;
        return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
      }),
    activeMemberCount: z
      .union([z.number(), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === null) return null;
        return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
      }),
    groupType: nullableString,
    type: nullableString,
    avatarUrl: nullableString,
    groupAvatarUrl: nullableString,
    groupAvatar: nullableString,
    invitedBy: invitedBySchema.optional().transform((v) => (v === undefined ? null : v)),
  })
  .passthrough();

function resolveInvitedBy(d: z.infer<typeof inboxItemSchema>): PendingGroupInviteInviterDto | null {
  const raw = d.invitedBy;
  if (raw === null) return null;
  const userId = typeof raw.userId === 'string' ? raw.userId.trim() : '';
  if (!isUuid(userId)) return null;
  return {
    userId,
    name: typeof raw.name === 'string' ? raw.name.trim() || null : null,
    username: typeof raw.username === 'string' ? raw.username.trim() || null : null,
    avatar: typeof raw.avatar === 'string' ? raw.avatar.trim() || null : null,
  };
}

function resolveInvitedByDisplayName(
  invitedBy: PendingGroupInviteInviterDto | null,
  legacyFlat: z.infer<typeof inboxItemSchema>,
): string | null {
  if (invitedBy) {
    const n = invitedBy.name?.trim();
    if (n) return n;
    const u = invitedBy.username?.trim();
    if (u) return `@${u}`;
  }
  const nested = legacyFlat.invitedBy;
  const fromNestedName =
    nested && typeof nested === 'object' && nested !== null && 'name' in nested
      ? (nested as { name?: string | null }).name
      : null;
  const candidates = [legacyFlat.invitedByName, legacyFlat.inviterName, fromNestedName];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

function parseInbox(data: unknown): GroupInviteInboxItem[] {
  if (!Array.isArray(data)) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid group invites inbox: expected an array.',
      status: 0,
    });
  }
  const out: GroupInviteInboxItem[] = [];
  for (const el of data) {
    const row = inboxItemSchema.safeParse(el);
    if (!row.success) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid group invite inbox entry.',
        status: 0,
        details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const d = row.data;
    const nameRaw = d.name ?? d.groupName ?? null;
    const typeRaw = d.groupType ?? d.type ?? null;
    const memberCount = d.memberCount ?? d.activeMemberCount ?? null;
    const avatarUrl = d.avatarUrl ?? d.groupAvatarUrl ?? d.groupAvatar ?? null;

    const invitedBy = resolveInvitedBy(d);
    const invitedByName = resolveInvitedByDisplayName(invitedBy, d);

    out.push({
      groupId: d.groupId,
      name: typeof nameRaw === 'string' ? nameRaw.trim() || null : null,
      invitedAt: d.invitedAt ?? null,
      invitedByName,
      invitedBy,
      role: d.role ?? null,
      memberCount,
      groupType: parseOptionalGroupType(typeRaw),
      avatarUrl,
    });
  }
  return out;
}

/**
 * `GET /v1/users/me/group-invites` — pending **`group_members`** (registered path);
 * newest first on the server.
 */
export function getMyGroupInvites(signal?: AbortSignal): Promise<GroupInviteInboxItem[]> {
  return apiFetch<unknown>(ENDPOINTS.users.meGroupInvites, {
    method: 'GET',
    signal,
  }).then(parseInbox);
}
