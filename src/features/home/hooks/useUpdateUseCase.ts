import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { updateProfile } from '@/features/auth/api/authApi';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import type { OnboardingUseCaseSlug } from '@/features/onboarding/api/runOnboardingFlow';
import { logger } from '@/services';

export function useUpdateUseCase() {
  const queryClient = useQueryClient();
  const inFlightRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (useCase: OnboardingUseCaseSlug) => updateProfile({ useCase }),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.NETWORK_ERROR) {
        return failureCount < 1;
      }
      return false;
    },
    retryDelay: () => 200 + Math.random() * 200,
    onSuccess: (profile) => {
      setAuthMeCacheFromPatch(queryClient, profile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
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
    (slug: OnboardingUseCaseSlug) => {
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

  return { submit, isPending: mutation.isPending, mutation };
}
