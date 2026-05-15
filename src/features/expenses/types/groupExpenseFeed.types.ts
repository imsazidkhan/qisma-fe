import { z } from 'zod';

export type ExpenseFeedSortMode = 'created_at' | 'expense_date';

/**
 * Mirrors Veloraq `ListExpensesQueryDto` — `GET /v1/groups/:groupId/expenses`.
 *
 * Wire names: **`categoryId`** (singular UUID), **`fromDate`** / **`toDate`** (`YYYY-MM-DD`).
 * Legacy **`categoryIds`** / **`dateFrom`** / **`dateTo`** still serialize for older gateways.
 */
export type GroupExpenseFeedFilters = {
  /** Sort axis; must stay stable across cursor pagination for the same query. Default server: `created_at`. */
  sort?: ExpenseFeedSortMode;
  limit?: number;
  q?: string;
  category?: string;
  /** Veloraq — filter by primary category UUID. */
  categoryId?: string;
  categoryIds?: string[];
  subcategoryIds?: string[];
  merchantIds?: string[];
  tagIds?: string[];
  city?: string;
  recurringDetected?: boolean;
  metaOccasion?: string;
  metaVibe?: string;
  metaWeather?: string;
  metaSocial?: string;
  metaTimeOfDay?: string;
  paidByUserId?: string;
  createdByUserId?: string;
  /** Veloraq date lower bound (`YYYY-MM-DD`). */
  fromDate?: string;
  /** Veloraq date upper bound (`YYYY-MM-DD`). */
  toDate?: string;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  splitType?: string;
  includeDeleted?: boolean;
};

const nonNegativeCount = z.preprocess(
  (v) => (v === undefined || v === null ? 0 : v),
  z.coerce.number().int().nonnegative(),
);

/**
 * Feed row — Veloraq **`ExpenseFeedItemDto`** adds **`splitParticipantPreview`** (≤2 faces) and
 * **`splitParticipantCount`** for **`+N`**. Read with **`readExpenseFeedParticipantFaces`** /
 * **`readExpenseFeedParticipantCount`** in **`expenseFeedRowFormat`**.
 */
const groupExpenseFeedItemSchema = z
  .object({
    /** Veloraq uses UUID strings; avoid strict `.uuid()` so minor format drift doesn’t blank the feed. */
    id: z.string().min(1),
    /** Omitted on some group list DTOs — caller may inject route `groupId`. */
    groupId: z.string().min(1).optional(),
    title: z.preprocess((v) => (v === undefined || v === null ? '' : v), z.coerce.string()),
    amount: z.union([z.string(), z.number(), z.bigint()]).transform((a) => String(a)),
    currency: z.coerce
      .string()
      .transform((s) => s.trim().toUpperCase())
      .pipe(z.string().length(3)),
    date: z.string(),
    /** Omitted when only `paidBy` snippet is present. */
    paidByUserId: z.string().min(1).nullish(),
    createdByUserId: z.string().min(1).nullish(),
    /** Some list DTOs only guarantee `date`; footer falls back to `date` in the row. */
    createdAt: z.string().min(1).optional(),
    deletedAt: z.union([z.string(), z.null()]).optional(),
    commentCount: nonNegativeCount,
    reactionCount: nonNegativeCount,
    attachmentCount: nonNegativeCount,
  })
  .passthrough();

export const groupExpenseFeedPageSchema = z
  .object({
    items: z.array(groupExpenseFeedItemSchema),
    nextCursor: z.union([z.string(), z.null()]).optional(),
    hasMore: z.boolean().optional(),
  })
  .transform((p) => ({
    ...p,
    hasMore:
      typeof p.hasMore === 'boolean'
        ? p.hasMore
        : Boolean(p.nextCursor !== undefined && p.nextCursor !== null && p.nextCursor !== ''),
  }));

export type GroupExpenseFeedItem = z.infer<typeof groupExpenseFeedItemSchema>;
export type GroupExpenseFeedPage = z.infer<typeof groupExpenseFeedPageSchema>;

/** Alias for backend `ListExpensesQueryDto` (group expense list). */
export type ListExpensesQueryDto = GroupExpenseFeedFilters;
