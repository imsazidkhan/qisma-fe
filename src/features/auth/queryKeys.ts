/**
 * Canonical React Query keys for auth endpoints. Use with `useQuery` / `invalidateQueries`.
 */
export const authQueryKeys = {
  root: ['auth'] as const,
  /** `GET /v1/auth/me` — current user + onboarding hints */
  me: ['auth', 'me'] as const,
} as const;
