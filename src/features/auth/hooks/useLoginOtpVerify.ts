import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import { ANALYTICS_EVENTS, OTP } from '@/constants';
import { parseAuthServiceError, type UiAuthError } from '@/features/auth/api/parseAuthServiceError';
import { useSendOtp } from './useSendOtp';
import { useVerifyOtp } from './useVerifyOtp';
import { selectOtpState, useOtpFlowStore } from '@/features/auth/store';
import { useCountdownToTimestamp, useNetworkStatus } from '@/hooks';
import { track } from '@/services';
import { maskPhoneE164 } from '@/utils';

import type { StatusDotState } from '@/components/ui';

type Args = {
  phoneE164: string;
  sessionId: string;
  expiresAt: number;
  resendAt: number;
};

/**
 * OTP step: TTL, auto-submit on 6 digits, resend gating (wait timers + server
 * `COOLDOWN_ACTIVE` via `resendCooldownUntil`), verify errors, expiry → store.
 */
export function useLoginOtpVerify({ phoneE164, sessionId, expiresAt, resendAt }: Args) {
  const { t } = useTranslation();
  const reset = useOtpFlowStore((s) => s.reset);
  const markExpired = useOtpFlowStore((s) => s.markExpired);
  const clearResendCooldown = useOtpFlowStore((s) => s.clearResendCooldown);
  const otpFlowState = useOtpFlowStore(selectOtpState);

  const [otp, setOtp] = useState('');
  const expiryHandledRef = useRef(false);
  const otpWasCompleteRef = useRef(false);

  const { isOnline } = useNetworkStatus();
  const { verify, isPending: isVerifyPending, mutation: verifyMutation } = useVerifyOtp();
  const { sendOtp, isPending: isResendPending } = useSendOtp();

  const seconds = useCountdownToTimestamp(expiresAt);
  const expired = seconds === 0;
  const masked = maskPhoneE164(phoneE164);

  const progress = useMemo(() => Math.max(0, Math.min(1, seconds / OTP.TTL_SECONDS)), [seconds]);

  const resendWaitSeconds = useCountdownToTimestamp(resendAt);
  const resendCooldownUntilMs =
    otpFlowState.status === 'sent' ? (otpFlowState.resendCooldownUntil ?? null) : null;
  const resendCooldownSeconds = useCountdownToTimestamp(resendCooldownUntilMs);

  useEffect(() => {
    if (resendCooldownUntilMs === null) return;
    if (resendCooldownSeconds !== 0) return;
    clearResendCooldown();
  }, [resendCooldownUntilMs, resendCooldownSeconds, clearResendCooldown]);

  const canResend =
    resendWaitSeconds === 0 &&
    resendCooldownSeconds === 0 &&
    !isResendPending &&
    !expired &&
    !isVerifyPending &&
    isOnline;

  const uiVerifyError = useMemo((): UiAuthError | null => {
    if (!verifyMutation.isError || verifyMutation.error === null) return null;
    return parseAuthServiceError(verifyMutation.error, 'verify');
  }, [verifyMutation.isError, verifyMutation.error]);

  useEffect(() => {
    expiryHandledRef.current = false;
  }, [expiresAt]);

  useEffect(() => {
    const complete = otp.length === OTP.CODE_LENGTH;
    const becameComplete = complete && !otpWasCompleteRef.current;
    otpWasCompleteRef.current = complete;
    if (!becameComplete) return;
    if (expired || !isOnline || isVerifyPending) return;
    verify({ sessionId, otp });
  }, [otp, expired, isOnline, isVerifyPending, sessionId, verify]);

  useEffect(() => {
    if (seconds > 0) return;
    if (expiryHandledRef.current) return;
    expiryHandledRef.current = true;
    markExpired();
    track(ANALYTICS_EVENTS.OTP_SESSION_EXPIRED_CLIENT_SIDE, {});
  }, [seconds, markExpired]);

  useEffect(() => {
    if (expired) {
      AccessibilityInfo.announceForAccessibility(t('auth.phone.sentExpired'));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [expired, t]);

  const dotState: StatusDotState = !isOnline
    ? 'offline'
    : expired
      ? 'error'
      : verifyMutation.isError
        ? 'error'
        : isVerifyPending
          ? 'sending'
          : 'online';

  const onOtpChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP.CODE_LENGTH);
    setOtp(digits);
    verifyMutation.reset();
  };

  const onVerify = () => {
    if (otp.length !== OTP.CODE_LENGTH || expired || !isOnline || isVerifyPending) return;
    verify({ sessionId, otp });
  };

  const onResend = () => {
    if (!canResend) return;
    track(ANALYTICS_EVENTS.OTP_RESEND_TAPPED, { source: 'otp-screen' });
    sendOtp({ phoneE164 });
  };

  const verifySubmitDisabled =
    otp.length !== OTP.CODE_LENGTH || !isOnline || isVerifyPending || expired;

  return {
    reset,
    otp,
    masked,
    seconds,
    expired,
    progress,
    dotState,
    isOnline,
    isVerifyPending,
    isResendPending,
    verifyMutation,
    uiVerifyError,
    resendWaitSeconds,
    resendCooldownSeconds,
    canResend,
    onOtpChange,
    onVerify,
    onResend,
    verifySubmitDisabled,
  };
}
