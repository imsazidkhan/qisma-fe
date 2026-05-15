export const expensesQueryKeys = {
  root: ['expenses'] as const,
  groupFeed: (groupId: string, filterKey: string) =>
    ['expenses', 'feed', groupId, filterKey] as const,
  /** Invalidate every `groupFeed` query for this group (any filter key). */
  groupFeedScope: (groupId: string) => ['expenses', 'feed', groupId] as const,
  detail: (groupId: string, expenseId: string) =>
    ['expenses', 'detail', groupId, expenseId] as const,
} as const;
