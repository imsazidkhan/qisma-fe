import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { tryNormalizeToE164 } from '@/utils';

import type {
  GroupMemberRosterEntry,
  GroupMemberRole,
} from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';

const rosterAvatarSchema = z.preprocess(
  (v) => {
    if (v === '' || v === undefined) return null;
    return v;
  },
  z.union([
    z.null(),
    z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), 'Expected http(s) URL'),
  ]),
);

const groupMemberRosterEntrySchema = z
  .object({
    id: z.string().uuid(),
    avatar: rosterAvatarSchema.optional().transform((v) => v ?? null),
    name: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    username: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    role: z.enum(['owner', 'admin', 'member']),
    status: z
      .enum(['active', 'pending'])
      .optional()
      .transform((v) => (v === undefined ? 'active' : v)),
    joinedAt: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    identifier: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (v === undefined ? null : v)),
  })
  .passthrough();

export type AddGroupMemberBody = { identifier: string } | { username: string } | { userId: string };

function withNormalizedPhoneForWire(body: AddGroupMemberBody): AddGroupMemberBody {
  if (!('identifier' in body)) return body;
  const e164 = tryNormalizeToE164(body.identifier, DEFAULT_PHONE_REGION);
  if (e164 === null) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid phone number.',
      status: 400,
    });
  }
  return { identifier: e164 };
}

export type UpdateGroupMemberRoleBody = { role: Exclude<GroupMemberRole, 'owner'> };

/**
 * Unwraps roster payloads: bare array, or `{ roster }` / `{ members }` after `data` unwrap.
 */
export function tryParseRosterPayload(raw: unknown): GroupMemberRosterEntry[] | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    try {
      return parseMembersRoster(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.roster)) {
      try {
        return parseMembersRoster(o.roster);
      } catch {
        return null;
      }
    }
    if (Array.isArray(o.members)) {
      try {
        return parseMembersRoster(o.members);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function requireRosterPayload(raw: unknown, context: string): GroupMemberRosterEntry[] {
  const roster = tryParseRosterPayload(raw);
  if (!roster) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: `${context}: expected member roster array or { roster | members }.`,
      status: 0,
    });
  }
  return roster;
}

export function parseMembersRoster(data: unknown): GroupMemberRosterEntry[] {
  if (!Array.isArray(data)) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid members roster: expected an array.',
      status: 0,
    });
  }
  const out: GroupMemberRosterEntry[] = [];
  for (const el of data) {
    const row = groupMemberRosterEntrySchema.safeParse(el);
    if (!row.success) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid group member roster entry.',
        status: 0,
        details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    out.push(row.data as GroupMemberRosterEntry);
  }
  return out;
}

/**
 * `GET /v1/groups/:groupId/members` — caller must be an active member.
 */
export function getGroupMembers(
  groupId: string,
  signal?: AbortSignal,
): Promise<GroupMemberRosterEntry[]> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'Group not found.',
      status: 404,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.members(groupId), {
    method: 'GET',
    signal,
  }).then(parseMembersRoster);
}

/**
 * `POST /v1/groups/:groupId/members` — body must contain exactly one of
 * `identifier` (E.164 phone), `username`, or `userId` (`201`, `data` = updated roster).
 */
export function addGroupMember(
  groupId: string,
  body: AddGroupMemberBody,
  signal?: AbortSignal,
): Promise<GroupMemberRosterEntry[]> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group id.',
      status: 400,
    });
  }
  const keys = Object.keys(body) as (keyof AddGroupMemberBody)[];
  if (keys.length !== 1) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Add member body must have exactly one of identifier, username, userId.',
      status: 0,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.members(groupId), {
    method: 'POST',
    body: withNormalizedPhoneForWire(body),
    signal,
  }).then((raw) => requireRosterPayload(raw, 'Add group member'));
}

/**
 * `POST /v1/groups/:groupId/invites/accept` — invitee; idempotent; `data` may be roster or empty.
 */
export function acceptGroupInvite(
  groupId: string,
  signal?: AbortSignal,
): Promise<GroupMemberRosterEntry[] | null> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group id.',
      status: 400,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.inviteAccept(groupId), {
    method: 'POST',
    body: {},
    signal,
  }).then((raw) => tryParseRosterPayload(raw));
}

const declineInviteResponseSchema = z
  .object({
    groupId: z.string().uuid(),
  })
  .passthrough();

/**
 * `POST /v1/groups/:groupId/invites/decline` — invitee removes pending membership.
 * Response may include `data.groupId`.
 */
export function declineGroupInvite(
  groupId: string,
  signal?: AbortSignal,
): Promise<{ groupId: string } | null> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group id.',
      status: 400,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.inviteDecline(groupId), {
    method: 'POST',
    body: {},
    signal,
  }).then((raw) => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'object') return null;
    const row = declineInviteResponseSchema.safeParse(raw);
    if (!row.success) return null;
    return { groupId: row.data.groupId };
  });
}

/**
 * `PATCH /v1/groups/:groupId/members/:memberId/role` — owner only; body `{ role: 'admin' | 'member' }`.
 */
export function updateGroupMemberRole(
  groupId: string,
  memberId: string,
  body: UpdateGroupMemberRoleBody,
  signal?: AbortSignal,
): Promise<GroupMemberRosterEntry[]> {
  if (!isUuid(groupId) || !isUuid(memberId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group or member id.',
      status: 400,
    });
  }
  if (body.role !== 'admin' && body.role !== 'member') {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Role patch may only target admin or member.',
      status: 0,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.memberRole(groupId, memberId), {
    method: 'PATCH',
    body,
    signal,
  }).then((raw) => requireRosterPayload(raw, 'Update group member role'));
}

/**
 * `DELETE /v1/groups/:groupId/members/:memberId` — `memberId` is target user UUID (`200`, `data` = remaining roster).
 */
export function removeGroupMember(
  groupId: string,
  memberId: string,
  signal?: AbortSignal,
): Promise<GroupMemberRosterEntry[]> {
  if (!isUuid(groupId) || !isUuid(memberId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group or member id.',
      status: 400,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.member(groupId, memberId), {
    method: 'DELETE',
    signal,
  }).then((raw) => requireRosterPayload(raw, 'Remove group member'));
}
