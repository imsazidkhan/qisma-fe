import { useQuery } from '@tanstack/react-query';

import { fetchExpenseCategories } from '@/features/expenses/api/expenseCategoriesApi';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function useExpenseCategories(options?: { enabled?: boolean }) {
  const { isOnline, isReady } = useNetworkStatus();
  const enabled = (options?.enabled ?? true) && isReady && isOnline;

  return useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: ({ signal }) => fetchExpenseCategories(signal),
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
}
