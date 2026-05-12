import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { updateProfile } from '@/features/auth/api/authApi';
import { refreshStoredSession } from '@/features/auth/services/authSession';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { logger } from '@/services';

import { mapUpdateProfileError } from '../api/mapUpdateProfileError';
import { setNameStepOnboardingComplete } from '../services/displayNameOnboardingFlag';

/**
 * Saves display name via `PATCH /v1/auth/me`, refreshes the session, marks the
 * name step complete on-device, and routes to `/onboarding/avatar`.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  const inFlightRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      return updateProfile({ name });
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.NETWORK_ERROR) {
        return failureCount < 1;
      }
      return false;
    },
    retryDelay: () => 200 + Math.random() * 200,

    onSuccess: async (profile) => {
      const accessToken = useAuthSessionStore.getState().accessToken;
      if (accessToken) {
        setNameStepOnboardingComplete(accessToken);
      }
      try {
        await refreshStoredSession();
      } catch (e) {
        logger.captureException(e, { tags: { phase: 'refresh-after-profile' } });
      }
      setAuthMeCacheFromPatch(queryClient, profile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/onboarding/avatar');
    },

    onError: (error) => {
      const ui = mapUpdateProfileError(error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (ui.severity === 'unexpected') {
        logger.captureException(error, {
          endpoint: '/v1/auth/me',
          errorCode: ui.code,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
  });

  const submit = useCallback(
    (trimmedName: string) => {
      if (inFlightRef.current || mutation.isPending) return;
      inFlightRef.current = true;
      mutation.mutate(trimmedName, {
        onSettled: () => {
          inFlightRef.current = false;
        },
      });
    },
    [mutation],
  );

  return {
    submit,
    isPending: mutation.isPending,
    mutation,
  };
}
