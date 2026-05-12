/**
 * Single source of truth for analytics event names. Use these constants
 * everywhere — never inline a string. Renames go through this file so the
 * data team can negotiate with one PR.
 *
 * Naming: `noun_action[_qualifier]`, snake_case, lowercase.
 */
export const ANALYTICS_EVENTS = {
  // ── /v1/otp/send ─────────────────────────────────────────────────────
  OTP_SEND_INITIATED: 'otp_send_initiated',
  OTP_SEND_SUCCEEDED: 'otp_send_succeeded',
  OTP_SEND_FAILED: 'otp_send_failed',
  OTP_SEND_BLOCKED_OFFLINE: 'otp_send_blocked_offline',
  OTP_SEND_COOLDOWN_BLOCKED: 'otp_send_cooldown_blocked',

  OTP_VERIFY_INITIATED: 'otp_verify_initiated',
  OTP_VERIFY_SUCCEEDED: 'otp_verify_succeeded',
  OTP_VERIFY_FAILED: 'otp_verify_failed',
  OTP_RESEND_TAPPED: 'otp_resend_tapped',
  OTP_SESSION_EXPIRED_CLIENT_SIDE: 'otp_session_expired_client_side',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
