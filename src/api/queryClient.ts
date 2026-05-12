import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './ApiError';

/**
 * Production-grade defaults for the app's `QueryClient`.
 *
 * - Queries:    smart retry that skips 4xx (validation / auth / rate-limit) and
 *               retries 5xx + network failures up to twice with capped exponential
 *               backoff. Stale time avoids refetch storms on quick re-mounts.
 * - Mutations:  retry: 0. Mutations are side-effecting; auto-retry is dangerous.
 *               Canonical example: `/v1/otp/send` would send a second SMS on every
 *               retry. Opt-in per mutation when (and only when) the operation is
 *               provably idempotent (e.g. via Idempotency-Key).
 *
 * `refetchOnWindowFocus` only does anything once `focusManager` is bound to RN's
 * `AppState` (see `focusManager.ts`). Same story for `refetchOnReconnect` and
 * NetInfo via `onlineManager.ts`.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.isClientError) return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
