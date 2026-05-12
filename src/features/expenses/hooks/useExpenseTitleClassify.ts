import { useQuery } from '@tanstack/react-query';

import { classifyExpenseTitle } from '@/features/expenses/api/expenseClassifyApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function useExpenseTitleClassify(title: string, options?: { enabled?: boolean }) {
  const debounced = useDebouncedValue(title.trim(), 400);
  const { isOnline, isReady } = useNetworkStatus();
  const enabled = (options?.enabled ?? true) && isReady && isOnline && debounced.length >= 3;

  return useQuery({
    queryKey: ['expenses', 'classify', debounced],
    queryFn: ({ signal }) => classifyExpenseTitle(debounced, signal),
    enabled,
    staleTime: 120_000,
  });
}
