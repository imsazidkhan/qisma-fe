import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { updateProfile } from '@/features/auth/api/authApi';
import { refreshStoredSession } from '@/features/auth/services/authSession';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { logger } from '@/services';

import { mapUpdateProfileError } from '../api/mapUpdateProfileError';
import type { OnboardingUseCaseSlug } from '../api/runOnboardingFlow';
import { setDisplayNameOnboardingComplete } from '../services/displayNameOnboardingFlag';

/**
 * Persists **`PATCH /v1/auth/me`** with `useCase` + `onboardingCompleted`, refreshes tokens,
 * marks local onboarding done, navigates **`/home`**.
 *
 * Pass `null` to skip the use-case selection — only `{ onboardingCompleted: true }`
 * is sent, leaving `useCase` unset on the server (the user can fill it in later).
 */
export function useCompleteUseCaseOnboarding() {
  const queryClient = useQueryClient();
  const inFlightRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async (useCase: OnboardingUseCaseSlug | null) =>
      useCase === null
        ? updateProfile({ onboardingCompleted: true })
        : updateProfile({ useCase, onboardingCompleted: true }),
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
        setDisplayNameOnboardingComplete(accessToken);
      }
      try {
        await refreshStoredSession();
      } catch (e) {
        logger.captureException(e, { tags: { phase: 'refresh-after-use-case' } });
      }
      setAuthMeCacheFromPatch(queryClient, profile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/home' as Href);
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
    (slug: OnboardingUseCaseSlug | null) => {
      if (inFlightRef.current || mutation.isPending) return;
      inFlightRef.current = true;
      mutation.mutate(slug, {
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
