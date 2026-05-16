import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import { ANALYTICS_EVENTS } from '@/constants';
import { logger, track } from '@/services';
import { callingCodeBucketForAnalytics } from '@/utils/e164Analytics';

import { sendOtp } from '../api/otpApi';
import { parseAuthServiceError } from '../api/parseAuthServiceError';
import { useOtpFlowStore } from '../store/useOtpFlowStore';
import type { SendOtpRequest, SendOtpResponse } from '../types/otp.types';

/**
 * `useSendOtp` — the only sanctioned way to call `/v1/otp/send`.
 *
 * What this hook does that the raw mutation does NOT:
 *   1. Drives the `useOtpFlowStore` state machine on every transition
 *      (`onMutate → sending`, `onSuccess → sent`, `onError → cooldown |
 *      rateLimited | error`).
 *   2. Implements the spec-mandated retry policy: NO retries on /send EXCEPT
 *      a single jittered retry for transient network errors. Every other
 *      retry would cost an SMS.
 *   3. Fires structured, PII-free analytics events.
 *   4. Logs `unexpected`-severity failures (5xx, parse errors, contract
 *      drift) to the logger so Sentry catches them once wired.
 *   5. Exposes a `safeMutate` that hard-blocks double-submits even if the
 *      caller forgets to disable the button.
 *
 * The hook deliberately does NOT navigate. Navigation belongs to the screen
 * — keeps the hook reusable from a "resend" CTA later.
 */
export function useSendOtp() {
  const startSending = useOtpFlowStore((s) => s.startSending);
  const sentOk = useOtpFlowStore((s) => s.sentOk);
  const sentFail = useOtpFlowStore((s) => s.sentFail);

  const mutation = useMutation<SendOtpResponse, unknown, SendOtpRequest>({
    mutationFn: sendOtp,

    // Spec §9: single auto-retry for transient network errors only.
    // 4xx and 5xx are surfaced — never silently retried (5xx might mean the
    // SMS was already sent, double-billing the user's phone).
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.NETWORK_ERROR) {
        return failureCount < 1;
      }
      return false;
    },
    // Jitter: 200ms ± 100ms.
    retryDelay: () => 200 + Math.random() * 200,

    onMutate: ({ phoneE164 }) => {
      const snap = useOtpFlowStore.getState().state;
      if (snap.status === 'sent' && snap.phone === phoneE164) {
        return;
      }
      startSending(phoneE164);
      track(ANALYTICS_EVENTS.OTP_SEND_INITIATED, {
        // PII-safe: coarse calling-code bucket + length, NOT the phone itself.
        countryCode: callingCodeBucketForAnalytics(phoneE164),
        phoneLengthDigits: phoneE164.replace(/\D/g, '').length,
        source: 'auth-screen',
      });
    },

    onSuccess: (data, { phoneE164 }) => {
      sentOk({
        phone: phoneE164,
        sessionId: data.sessionId,
        expiresAt: data.expiresAt,
        retryAfterSec: data.retryAfter,
      });

      // Tactile confirmation. Best-effort; ignore platforms without haptics.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const expiresInSeconds = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000));
      track(ANALYTICS_EVENTS.OTP_SEND_SUCCEEDED, {
        retryAfter: data.retryAfter,
        expiresInSeconds,
      });

      // Clock-skew breadcrumb: server says it's already expired? Suspicious
      // device clock — log so we can correlate later. NEVER attach phone /
      // sessionId.
      if (expiresInSeconds <= 0) {
        logger.breadcrumb('otp.send.clock_skew_detected', {
          tags: { expiresInSeconds, retryAfter: data.retryAfter },
        });
      }
    },

    onError: (error, { phoneE164 }) => {
      const uiError = parseAuthServiceError(error);
      sentFail({ phone: phoneE164, uiError });

      // Warning haptic — distinct from the success notification so users feel
      // the difference even before reading the banner.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      track(ANALYTICS_EVENTS.OTP_SEND_FAILED, {
        code: uiError.code,
        httpStatus: error instanceof ApiError ? error.status : 0,
        retryAfter: uiError.retryAfter || undefined,
      });

      if (uiError.severity === 'unexpected') {
        // Only forward unexpected failures to the error backend. Cooldowns /
        // rate limits are user behaviour, not bugs.
        logger.captureException(error, {
          endpoint: '/v1/otp/send',
          errorCode: uiError.code,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
  });

  // Belt-and-braces double-submit guard. The screen ALSO disables the button
  // when `mutation.isPending`, but a slow render cycle can still let a fast
  // tap through. This ref-based lock is synchronous.
  const inFlightRef = useRef(false);
  const safeMutate = useCallback(
    (req: SendOtpRequest) => {
      if (inFlightRef.current || mutation.isPending) return;
      inFlightRef.current = true;
      mutation.mutate(req, {
        onSettled: () => {
          inFlightRef.current = false;
        },
      });
    },
    [mutation],
  );

  return {
    /** Use this — guarded against double-tap and re-entrancy. */
    sendOtp: safeMutate,
    isPending: mutation.isPending,
    /** Raw mutation — exposed for tests / advanced callers only. */
    mutation,
  };
}
