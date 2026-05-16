import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { logger } from '@/services/logger';

import { GROUP_TYPE_ORDER, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import type { Group } from '@/features/groups/types/group.types';
import type { GroupsHomeData, GroupsHomeTabQuery } from '@/features/groups/types/groupHome.types';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import type { MyGroupRowDto } from '@/features/groups/types/myGroups.types';
import { groupToListItem } from '@/features/groups/utils/groupToListItem';
import { myGroupHomeCardToListItem } from '@/features/groups/utils/myGroupHomeCardToListItem';
import { myGroupRowToListItem } from '@/features/groups/utils/myGroupRowToListItem';
import { isUuid } from '@/features/groups/utils/isUuid';

const groupTypeSchema = z.enum(GROUP_TYPE_ORDER);

const nullableHttpUrl = z.preprocess(
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

function parseOptionalAvatarUrl(raw: string | undefined | null): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

export const groupSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    type: groupTypeSchema,
    avatar: nullableHttpUrl,
    createdByUserId: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (v === undefined ? null : v)),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

function parseGroupData(data: unknown): Group {
  const row = groupSchema.safeParse(data);
  if (!row.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid group response shape.',
      status: 0,
      details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  return row.data as Group;
}

function coerceWireGroupTypeSlug(raw: unknown): GroupTypeId {
  if (raw == null) return 'other';
  const v = String(raw).trim().toLowerCase();
  return (GROUP_TYPE_ORDER as readonly string[]).includes(v) ? (v as GroupTypeId) : 'other';
}

/** `GroupInvitePreviewDataDto` — pending invitee only (`GET …/invite-preview`). */
const invitePreviewSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.union([z.string(), z.null()]).transform(coerceWireGroupTypeSlug),
    avatar: nullableHttpUrl,
    memberCount: z
      .union([z.number(), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === null) return null;
        return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
      }),
    createdByUserId: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (v === undefined ? null : v)),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

function parseInvitePreviewData(data: unknown): Group {
  const row = invitePreviewSchema.safeParse(data);
  if (!row.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid invite preview response shape.',
      status: 0,
      details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  const d = row.data;
  const createdAt = d.createdAt?.trim() ?? '';
  const updatedAt = d.updatedAt?.trim() ?? '';
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    avatar: d.avatar ?? null,
    createdByUserId: d.createdByUserId ?? null,
    createdAt,
    updatedAt,
    memberCount: d.memberCount ?? null,
  };
}

export type CreateGroupPayload = {
  name: string;
  type: GroupTypeId;
  /** Optional image URL; must be `http` or `https` if set. */
  avatar?: string | null;
};

function assertCreateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Name must be between 2 and 50 characters.',
      status: 400,
    });
  }
  return trimmed;
}

/**
 * `POST /v1/groups` — returns created `Group` (`201` body `data`).
 */
export function createGroup(payload: CreateGroupPayload, signal?: AbortSignal): Promise<Group> {
  const name = assertCreateName(payload.name);
  const body: { name: string; type: GroupTypeId; avatar?: string } = {
    name,
    type: payload.type,
  };
  const avatar = parseOptionalAvatarUrl(payload.avatar ?? null);
  if (avatar) {
    body.avatar = avatar;
  }
  return apiFetch<unknown>(ENDPOINTS.groups.create, {
    method: 'POST',
    body,
    signal,
  }).then(parseGroupData);
}

const myGroupRowSchema = z
  .object({
    group: z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: groupTypeSchema,
      avatar: nullableHttpUrl,
    }),
    role: z.string(),
    joinedAt: z.string(),
    isCreator: z.boolean(),
  })
  .passthrough();

/**
 * `GET /v1/users/me/groups` — primary **home / My groups** membership list (`data[]`).
 */
export function getMyGroupsList(signal?: AbortSignal): Promise<GroupListItem[]> {
  return apiFetch<unknown>(ENDPOINTS.users.meGroups, { method: 'GET', signal }).then((raw) => {
    if (!Array.isArray(raw)) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid my groups list: expected an array.',
        status: 0,
      });
    }
    const out: GroupListItem[] = [];
    let skippedInvalidRows = 0;
    for (const el of raw) {
      const parsed = myGroupRowSchema.safeParse(el);
      if (parsed.success) {
        out.push(myGroupRowToListItem(parsed.data as MyGroupRowDto));
      } else {
        skippedInvalidRows += 1;
      }
    }
    if (skippedInvalidRows > 0) {
      logger.breadcrumb('my_groups_parse_skipped_rows', {
        endpoint: ENDPOINTS.users.meGroups,
        tags: { skippedInvalidRows },
      });
    }
    return out;
  });
}

const balanceBucketSchema = z.enum(['owe', 'get_back', 'settled']);

const myGroupHomeCardSchema = z
  .object({
    groupId: z.string().uuid(),
    group: z
      .object({
        name: z.string(),
        type: z.string(),
        avatar: nullableHttpUrl,
      })
      .passthrough(),
    memberCount: z.number().int().nonnegative().optional(),
    expenseCount: z.number().int().nonnegative().optional(),
    recentExpenseTitle: z.union([z.string(), z.null()]).optional(),
    balanceNetMinor: z.union([z.string(), z.number()]),
    dominantCurrency: z.string(),
    balanceBucket: balanceBucketSchema,
    pendingSettlementCount: z.number().int().nonnegative().optional(),
    lastActivityAt: z.union([z.string(), z.null()]).optional(),
    lastActivityType: z.union([z.string(), z.null()]).optional(),
    lastActivityActorName: z.union([z.string(), z.null()]).optional(),
    lastActivityPreview: z.union([z.string(), z.null()]).optional(),
    balanceUpdatedAt: z.union([z.string(), z.null()]).optional(),
    role: z.string().optional(),
    joinedAt: z.string().optional(),
    isCreator: z.boolean().optional(),
  })
  .passthrough();

const groupsHomeDataSchema = z.object({
  tab: z.enum(['all', 'owe', 'get_back', 'settled']),
  items: z.array(z.unknown()),
});

function filterGroupsHomeItemsByTab(items: GroupListItem[], tab: GroupsHomeTabQuery): GroupListItem[] {
  if (tab === 'all') return items;
  if (tab === 'owe') return items.filter((i) => i.balance.tone === 'you_owe');
  if (tab === 'get_back') return items.filter((i) => i.balance.tone === 'owed_to_you');
  return items.filter((i) => i.balance.tone === 'settled');
}

function shouldFallbackGroupsHomeToMembershipList(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

/**
 * `GET /v1/users/me/groups/home` — tabbed dashboard (`tab` query: all | owe | get_back | settled).
 *
 * If that route is missing (**404**), falls back to **`GET /v1/users/me/groups`**
 * and applies the same `tab` filter client-side (balance tones on membership rows).
 */
export async function getMyGroupsHome(
  tab: GroupsHomeTabQuery = 'all',
  signal?: AbortSignal,
): Promise<GroupsHomeData> {
  const params = new URLSearchParams();
  if (tab !== 'all') {
    params.set('tab', tab);
  }
  const qs = params.toString();
  const path =
    qs.length > 0 ? `${ENDPOINTS.users.meGroupsHome}?${qs}` : ENDPOINTS.users.meGroupsHome;

  try {
    const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
    const envelope = groupsHomeDataSchema.safeParse(raw);
    if (!envelope.success) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid groups home response shape.',
        status: 0,
        details: envelope.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const tabFromApi = envelope.data.tab;
    const itemsRaw = envelope.data.items;
    const out: GroupListItem[] = [];
    let skippedInvalidRows = 0;
    for (const el of itemsRaw) {
      const one = myGroupHomeCardSchema.safeParse(el);
      if (one.success) {
        out.push(myGroupHomeCardToListItem(one.data));
      } else {
        skippedInvalidRows += 1;
      }
    }
    if (skippedInvalidRows > 0) {
      logger.breadcrumb('my_groups_home_parse_skipped_rows', {
        endpoint: ENDPOINTS.users.meGroupsHome,
        tags: { skippedInvalidRows },
      });
    }
    return { tab: tabFromApi, items: out };
  } catch (err) {
    if (!shouldFallbackGroupsHomeToMembershipList(err)) {
      throw err;
    }
    logger.breadcrumb('my_groups_home_fallback_membership', {
      endpoint: ENDPOINTS.users.meGroups,
      tags: { requestedTab: tab },
    });
    try {
      const items = await getMyGroupsList(signal);
      return { tab, items: filterGroupsHomeItemsByTab(items, tab) };
    } catch {
      throw err;
    }
  }
}

/**
 * `GET /v1/groups` — groups **created** by the current user (optional surface; not the default home feed).
 */
export function getCreatedGroupsList(signal?: AbortSignal): Promise<GroupListItem[]> {
  return apiFetch<unknown>(ENDPOINTS.groups.list, { method: 'GET', signal }).then((raw) => {
    if (!Array.isArray(raw)) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid created groups list: expected an array.',
        status: 0,
      });
    }
    const out: GroupListItem[] = [];
    for (const el of raw) {
      const parsed = groupSchema.safeParse(el);
      if (parsed.success) {
        out.push(groupToListItem(parsed.data as Group));
      }
    }
    return out;
  });
}

/**
 * `GET /v1/groups/:groupId` — **creator-owning** full row only. Non-creators (even active members)
 * receive `404` `GROUP_NOT_FOUND`. Use {@link getGroupMemberProfile} for the group detail screen
 * when the user is an active member.
 */
export function getGroupById(groupId: string, signal?: AbortSignal): Promise<Group> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'Group not found.',
      status: 404,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.detail(groupId), { method: 'GET', signal }).then(
    parseGroupData,
  );
}

/**
 * `GET /v1/groups/:groupId/member-profile` — same `Group` shape as creator detail; requires an
 * **active** group membership (`403` `NOT_GROUP_MEMBER` while pending).
 */
export function getGroupMemberProfile(groupId: string, signal?: AbortSignal): Promise<Group> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'Group not found.',
      status: 404,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.memberProfile(groupId), {
    method: 'GET',
    signal,
  }).then(parseGroupData);
}

/**
 * `GET /v1/groups/:groupId/invite-preview` — minimal fields for **pending** invitees (`403` if
 * already an active member).
 */
export function getGroupInvitePreview(groupId: string, signal?: AbortSignal): Promise<Group> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'Group not found.',
      status: 404,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.invitePreview(groupId), {
    method: 'GET',
    signal,
  }).then(parseInvitePreviewData);
}

const deleteGroupResponseSchema = z.object({
  deletedGroupId: z.string().uuid(),
});

/**
 * `DELETE /v1/groups/:groupId` — returns `data.deletedGroupId` (`200`).
 */
export function deleteGroup(groupId: string, signal?: AbortSignal): Promise<string> {
  if (!isUuid(groupId)) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid group id.',
      status: 400,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.groups.detail(groupId), {
    method: 'DELETE',
    signal,
  }).then((raw) => {
    const row = deleteGroupResponseSchema.safeParse(raw);
    if (!row.success) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid delete group response shape.',
        status: 0,
        details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    return row.data.deletedGroupId;
  });
}
