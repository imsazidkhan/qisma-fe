import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { authQueryKeys } from '../queryKeys';
import { signOut as signOutService } from '../services/authSession';
import { useAuthSessionStore } from '../store/useAuthSessionStore';

/**
 * UI-facing session surface: Zustand auth store + `signOut` orchestration.
 * Prefer this over touching the store directly from screens when possible.
 */
export function useAuthSession() {
  const queryClient = useQueryClient();
  const accessToken = useAuthSessionStore((s) => s.accessToken);
  const expiresIn = useAuthSessionStore((s) => s.expiresIn);
  const tokenType = useAuthSessionStore((s) => s.tokenType);
  const isAuthenticated = Boolean(accessToken);

  const signOut = useCallback(async () => {
    await signOutService();
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
  }, [queryClient]);

  return {
    accessToken,
    expiresIn,
    tokenType,
    isAuthenticated,
    signOut,
  };
}
