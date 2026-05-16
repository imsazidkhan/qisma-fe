import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { classifyExpenseTitle } from '@/features/expenses/api/expenseClassifyApi';
import type { ExpenseClassifyResponse } from '@/features/expenses/types/expenseTaxonomy.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export type ExpenseTitleClassifyQuery = UseQueryResult<ExpenseClassifyResponse, Error>;

export function useExpenseTitleClassify(
  title: string,
  options?: { enabled?: boolean },
): {
  classifyQuery: ExpenseTitleClassifyQuery;
  debouncedTitle: string;
  showTitleClassifyChecking: boolean;
} {
  const trimmed = title.trim();
  const debouncedTitle = useDebouncedValue(trimmed, 400);
  const { isOnline, isReady } = useNetworkStatus();
  const classifyEnabled =
    (options?.enabled ?? true) && isReady && isOnline && debouncedTitle.length >= 3;

  const classifyQuery = useQuery({
    queryKey: ['expenses', 'classify', debouncedTitle],
    queryFn: ({ signal }) => classifyExpenseTitle(debouncedTitle, signal),
    enabled: classifyEnabled,
    staleTime: 120_000,
  });

  const showTitleClassifyChecking =
    trimmed.length >= 3 &&
    isReady &&
    isOnline &&
    (trimmed !== debouncedTitle || (classifyEnabled && classifyQuery.isFetching));

  return { classifyQuery, debouncedTitle, showTitleClassifyChecking };
}
