import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';

import type {
  GroupActivityItem,
  GroupActivityPerson,
} from '@/features/groups/types/groupActivity.types';

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

const activityPersonSchema = z
  .object({
    id: z.string(),
    name: z.union([z.string(), z.null()]).optional(),
    username: z.union([z.string(), z.null()]).optional(),
    avatar: z.union([nullableHttpUrl, z.undefined()]).optional(),
  })
  .passthrough();

function normalizePerson(raw: z.infer<typeof activityPersonSchema>): GroupActivityPerson {
  const name = raw.name === undefined || raw.name === null ? null : raw.name;
  const username = raw.username === undefined || raw.username === null ? null : raw.username;
  let avatar: string | null = null;
  if (raw.avatar !== undefined && raw.avatar !== null) {
    avatar = raw.avatar;
  }
  return {
    id: raw.id,
    name,
    username,
    avatar,
  };
}

const activityItemSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    createdAt: z.string(),
    actor: z.union([z.null(), activityPersonSchema]).optional(),
    subject: z.union([z.null(), activityPersonSchema]).optional(),
    payload: z.unknown().optional(),
  })
  .passthrough();

function normalizeActivityItem(raw: z.infer<typeof activityItemSchema>): GroupActivityItem {
  const actorRaw = raw.actor === undefined ? null : raw.actor;
  const subjectRaw = raw.subject === undefined ? null : raw.subject;
  return {
    id: raw.id,
    type: raw.type,
    createdAt: raw.createdAt,
    actor: actorRaw === null ? null : normalizePerson(actorRaw),
    subject: subjectRaw === null ? null : normalizePerson(subjectRaw),
    ...(raw.payload !== undefined ? { payload: raw.payload } : {}),
  };
}

/**
 * `GET /v1/groups/:groupId/activity` — active-member timeline (newest first).
 */
export function fetchGroupActivity(
  groupId: string,
  signal?: AbortSignal,
): Promise<GroupActivityItem[]> {
  return apiFetch<unknown>(ENDPOINTS.groups.activity(groupId), {
    method: 'GET',
    signal,
  }).then((raw) => {
    if (!Array.isArray(raw)) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid group activity response: expected an array.',
        status: 0,
      });
    }
    const out: GroupActivityItem[] = [];
    for (const el of raw) {
      const parsed = activityItemSchema.safeParse(el);
      if (parsed.success) {
        out.push(normalizeActivityItem(parsed.data));
      }
    }
    return out;
  });
}
