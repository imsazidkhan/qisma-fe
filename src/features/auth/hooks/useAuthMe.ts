import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getAuthMe } from '@/features/auth/api/authApi';
import type { AuthMeData } from '@/features/auth/types/auth.types';
import { authQueryKeys } from '@/features/auth/queryKeys';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';

/**
 * Subscribes to **`GET /v1/auth/me`** (current user + server `onboarding` hints).
 * Runs only when an access token is present; stays idle when signed out.
 *
 * Tuned to avoid duplicate network work: `staleTime` 60s + no refetch on window focus
 * (splash + mutations keep cache fresh via `fetchQuery` / `setAuthMeCacheFromPatch`).
 */
export function useAuthMe() {
  const accessToken = useAuthSessionStore((s) => s.accessToken);

  return useQuery<AuthMeData, Error>({
    queryKey: authQueryKeys.me,
    queryFn: ({ signal }) => getAuthMe(signal),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Imperative helpers for the same cache entry (e.g. after PATCH profile).
 */
export function useAuthMeActions() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
  }, [queryClient]);

  const remove = useCallback(() => {
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
  }, [queryClient]);

  return { invalidate, remove };
}
