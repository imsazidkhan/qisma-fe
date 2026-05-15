import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { updateProfile, uploadAvatar } from '@/features/auth/api/authApi';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { refreshStoredSession } from '@/features/auth/services/authSession';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { logger } from '@/services';

import { mapUpdateProfileError } from '../api/mapUpdateProfileError';
import { setAvatarStepOnboardingComplete } from '../services/displayNameOnboardingFlag';

export type PickedAvatar = {
  uri: string;
  fileName: string;
  mimeType: string;
};

/**
 * Uploads avatar (`POST /v1/upload/avatar`), saves URL (`PATCH /v1/auth/me`), refreshes tokens,
 * marks the avatar step locally, routes to **`/onboarding/use-case`**.
 */
export function useCompleteAvatarOnboarding() {
  const queryClient = useQueryClient();
  const inFlightRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async (picked: PickedAvatar) => {
      const { url } = await uploadAvatar({
        uri: picked.uri,
        fileName: picked.fileName,
        mimeType: picked.mimeType,
      });
      return updateProfile({ avatarUrl: url });
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
        setAvatarStepOnboardingComplete(accessToken);
      }
      try {
        await refreshStoredSession();
      } catch (e) {
        logger.captureException(e, { tags: { phase: 'refresh-after-avatar' } });
      }
      setAuthMeCacheFromPatch(queryClient, profile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/onboarding/use-case' as Href);
    },

    onError: (error) => {
      const ui = mapUpdateProfileError(error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (ui.severity === 'unexpected') {
        logger.captureException(error, {
          endpoint: '/v1/upload/avatar|/v1/auth/me',
          errorCode: ui.code,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
  });

  const submitWithPicked = useCallback(
    (picked: PickedAvatar) => {
      if (inFlightRef.current || mutation.isPending) return;
      inFlightRef.current = true;
      mutation.mutate(picked, {
        onSettled: () => {
          inFlightRef.current = false;
        },
      });
    },
    [mutation],
  );

  return {
    submitWithPicked,
    isPending: mutation.isPending,
    mutation,
  };
}
