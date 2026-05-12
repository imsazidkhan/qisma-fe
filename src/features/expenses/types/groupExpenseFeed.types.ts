import { z } from 'zod';

export type GroupExpenseFeedFilters = {
  limit?: number;
  q?: string;
  category?: string;
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
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  splitType?: string;
  includeDeleted?: boolean;
};

const groupExpenseFeedItemSchema = z
  .object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    title: z.string(),
    amount: z.string(),
    currency: z.string().length(3),
    date: z.string(),
    paidByUserId: z.string().uuid(),
    createdByUserId: z.string().uuid().optional(),
    createdAt: z.string(),
    deletedAt: z.union([z.string(), z.null()]).optional(),
    commentCount: z.number().int().nonnegative(),
    reactionCount: z.number().int().nonnegative(),
    attachmentCount: z.number().int().nonnegative(),
  })
  .passthrough();

export const groupExpenseFeedPageSchema = z.object({
  items: z.array(groupExpenseFeedItemSchema),
  nextCursor: z.union([z.string(), z.null()]).optional(),
  hasMore: z.boolean(),
});

export type GroupExpenseFeedItem = z.infer<typeof groupExpenseFeedItemSchema>;
export type GroupExpenseFeedPage = z.infer<typeof groupExpenseFeedPageSchema>;
