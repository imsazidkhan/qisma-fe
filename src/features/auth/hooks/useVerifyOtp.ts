import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { ANALYTICS_EVENTS } from '@/constants';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { resolveSignedInPath } from '@/features/onboarding/services/resolveSignedInPath';
import { useInvitesInboxReloadStore } from '@/features/invites/store/useInvitesInboxReloadStore';
import { logger, track } from '@/services';
import { createVerifyIdempotencyKey } from '@/utils';

import { getAuthMe } from '../api/authApi';
import { verifyOtp } from '../api/otpApi';
import { parseAuthServiceError } from '../api/parseAuthServiceError';
import { authQueryKeys } from '../queryKeys';
import { saveAuthSession } from '../services/authSession';
import { useAuthSessionStore } from '../store/useAuthSessionStore';
import { useOtpFlowStore } from '../store/useOtpFlowStore';
import type { AuthMeData } from '../types/auth.types';
import type { VerifyOtpResponse } from '../types/otp.types';

type VerifyVars = {
  sessionId: string;
  otp: string;
};

/**
 * Sanctioned caller for `POST /v1/otp/verify`: generates a fresh
 * `Idempotency-Key` per attempt, persists tokens on success, resets OTP flow
 * state, and navigates using **`GET /v1/auth/me`** when online (MMKV fallback if not).
 */
export function useVerifyOtp() {
  const resetFlow = useOtpFlowStore((s) => s.reset);
  const queryClient = useQueryClient();

  const mutation = useMutation<VerifyOtpResponse, unknown, VerifyVars>({
    mutationFn: async ({ sessionId, otp }) => {
      const idempotencyKey = createVerifyIdempotencyKey();
      return verifyOtp({ sessionId, otp, idempotencyKey });
    },

    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.NETWORK_ERROR) {
        return failureCount < 1;
      }
      return false;
    },
    retryDelay: () => 200 + Math.random() * 200,

    onSuccess: async (data) => {
      try {
        await saveAuthSession(data);
      } catch (e) {
        logger.captureException(e, { tags: { phase: 'persist-session' } });
        throw e instanceof Error ? e : new Error('Failed to store session');
      }
      resetFlow();
      useInvitesInboxReloadStore.getState().bumpInvitesInboxReload();
      void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      track(ANALYTICS_EVENTS.OTP_VERIFY_SUCCEEDED, { expiresIn: data.expiresIn });

      const accessToken = useAuthSessionStore.getState().accessToken;
      let me: AuthMeData | null = null;
      try {
        me = await queryClient.fetchQuery({
          queryKey: authQueryKeys.me,
          queryFn: ({ signal }) => getAuthMe(signal),
        });
      } catch {
        /* resolver uses MMKV */
      }

      const next = resolveSignedInPath({
        accessToken,
        me,
        useOfflineFallback: me === null,
      });
      router.replace(next as Href);
    },

    onError: (error) => {
      const uiError = parseAuthServiceError(error, 'verify');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      track(ANALYTICS_EVENTS.OTP_VERIFY_FAILED, {
        code: uiError.code,
        httpStatus: error instanceof ApiError ? error.status : 0,
        retryAfter: uiError.retryAfter || undefined,
      });
      if (uiError.severity === 'unexpected') {
        logger.captureException(error, {
          endpoint: '/v1/otp/verify',
          errorCode: uiError.code,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
  });

  const inFlightRef = useRef(false);
  const verify = useCallback(
    (vars: VerifyVars) => {
      if (inFlightRef.current || mutation.isPending) return;
      inFlightRef.current = true;
      track(ANALYTICS_EVENTS.OTP_VERIFY_INITIATED, { source: 'otp-screen' });
      mutation.mutate(vars, {
        onSettled: () => {
          inFlightRef.current = false;
        },
      });
    },
    [mutation],
  );

  return {
    verify,
    isPending: mutation.isPending,
    mutation,
  };
}
