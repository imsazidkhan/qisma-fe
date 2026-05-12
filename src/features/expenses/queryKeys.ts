export const expensesQueryKeys = {
  root: ['expenses'] as const,
  groupFeed: (groupId: string, filterKey: string) =>
    ['expenses', 'feed', groupId, filterKey] as const,
  /** Invalidate every `groupFeed` query for this group (any filter key). */
  groupFeedScope: (groupId: string) => ['expenses', 'feed', groupId] as const,
  detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
} as const;
