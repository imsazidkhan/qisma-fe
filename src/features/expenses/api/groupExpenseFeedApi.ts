import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import {
  groupExpenseFeedPageSchema,
  type GroupExpenseFeedFilters,
  type GroupExpenseFeedPage,
} from '@/features/expenses/types/groupExpenseFeed.types';

const LIMIT_MIN = 1;
const LIMIT_MAX = 100;
const LIMIT_DEFAULT = 20;

function appendIfDefined(
  search: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value === undefined) return;
  if (typeof value === 'boolean') {
    search.set(key, value ? 'true' : 'false');
    return;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return;
  const s = String(value).trim();
  if (s === '') return;
  search.set(key, s);
}

function appendUuidCsv(search: URLSearchParams, key: string, ids: string[] | undefined): void {
  if (!ids || ids.length === 0) return;
  const csv = [...new Set(ids.map((x) => x.trim()).filter(Boolean))].join(',');
  if (csv === '') return;
  search.set(key, csv);
}

export function buildGroupExpenseFeedSearchParams(
  filters: GroupExpenseFeedFilters,
  cursor: string | undefined,
): string {
  const search = new URLSearchParams();

  if (cursor !== undefined && cursor !== '') {
    search.set('cursor', cursor);
  }

  let limit = filters.limit;
  if (limit === undefined) {
    limit = LIMIT_DEFAULT;
  }
  const limitClamped = Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, Math.floor(limit)));
  search.set('limit', String(limitClamped));

  appendIfDefined(search, 'sort', filters.sort);

  appendIfDefined(search, 'q', filters.q);
  appendIfDefined(search, 'category', filters.category);
  appendIfDefined(search, 'categoryId', filters.categoryId);
  appendUuidCsv(search, 'categoryIds', filters.categoryIds);
  appendUuidCsv(search, 'subcategoryIds', filters.subcategoryIds);
  appendUuidCsv(search, 'merchantIds', filters.merchantIds);
  appendUuidCsv(search, 'tagIds', filters.tagIds);
  appendIfDefined(search, 'city', filters.city);
  if (filters.recurringDetected === true) {
    search.set('recurringDetected', 'true');
  }
  appendIfDefined(search, 'metaOccasion', filters.metaOccasion);
  appendIfDefined(search, 'metaVibe', filters.metaVibe);
  appendIfDefined(search, 'metaWeather', filters.metaWeather);
  appendIfDefined(search, 'metaSocial', filters.metaSocial);
  appendIfDefined(search, 'metaTimeOfDay', filters.metaTimeOfDay);
  appendIfDefined(search, 'paidByUserId', filters.paidByUserId);
  appendIfDefined(search, 'createdByUserId', filters.createdByUserId);
  appendIfDefined(search, 'fromDate', filters.fromDate ?? filters.dateFrom);
  appendIfDefined(search, 'toDate', filters.toDate ?? filters.dateTo);
  appendIfDefined(search, 'currency', filters.currency);
  appendIfDefined(search, 'splitType', filters.splitType);
  if (filters.includeDeleted === true) {
    search.set('includeDeleted', 'true');
  }

  return search.toString();
}

function normalizeExpenseFeedPageWire(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.items)) return raw;
  if (Array.isArray(o.expenses)) return { ...o, items: o.expenses };
  return raw;
}

export type ParseGroupExpenseFeedPageOpts = {
  /** When rows omit `groupId`, fill from the route param (group-scoped feed only). */
  defaultGroupId?: string;
};

export function parseGroupExpenseFeedPage(
  data: unknown,
  opts?: ParseGroupExpenseFeedPageOpts,
): GroupExpenseFeedPage {
  const normalized = normalizeExpenseFeedPageWire(data);
  const row = groupExpenseFeedPageSchema.safeParse(normalized);
  if (!row.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid expense feed response shape.',
      status: 0,
      details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  const fallbackGroupId = opts?.defaultGroupId?.trim();
  const items = row.data.items.map((item, index) => {
    const gid = item.groupId?.trim() ? item.groupId : fallbackGroupId;
    if (!gid) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid expense feed response shape.',
        status: 0,
        details: [`items.${String(index)}.groupId: missing`],
      });
    }
    return { ...item, groupId: gid };
  });
  return { ...row.data, items };
}

export async function fetchGroupExpenseFeedPage(
  groupId: string,
  args: { filters: GroupExpenseFeedFilters; cursor: string | undefined },
  signal?: AbortSignal,
): Promise<GroupExpenseFeedPage> {
  const qs = buildGroupExpenseFeedSearchParams(args.filters, args.cursor);
  const path = `${ENDPOINTS.expenses.groupFeed(groupId)}?${qs}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseGroupExpenseFeedPage(raw, { defaultGroupId: groupId });
}
