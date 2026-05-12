import { apiFetch, ENDPOINTS } from '@/api';

import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../types/otp.types';

/**
 * Fire `POST /v1/otp/send`.
 *
 * Contract:
 *   - Body: `{ phone: string }` — must already be E.164 (caller's job).
 *   - Success → returns `{ sessionId, expiresAt, retryAfter }`.
 *   - Failure → throws `ApiError` (already mapped from the auth-service
 *     envelope; pass through `parseAuthServiceError` for UI).
 *
 * NO `Idempotency-Key` here. /send is intentionally non-idempotent — every
 * accepted call costs an SMS. The hook layer (`useSendOtp`) is responsible
 * for ensuring we never fire it twice.
 */
export function sendOtp({ phoneE164, signal }: SendOtpRequest): Promise<SendOtpResponse> {
  return apiFetch<SendOtpResponse>(ENDPOINTS.otp.send, {
    method: 'POST',
    body: { phone: phoneE164 },
    signal,
    skipAuth: true,
  });
}

/**
 * Fire `POST /v1/otp/verify`.
 *
 * Contract:
 *   - Headers: `Idempotency-Key` (required) — pass via `idempotencyKey`.
 *   - Body: `{ sessionId, otp }`.
 *   - Success → `{ accessToken, refreshToken, expiresIn, tokenType }`.
 *   - Failure → `ApiError`; use `parseAuthServiceError(err, 'verify')` in UI.
 */
export function verifyOtp({
  sessionId,
  otp,
  idempotencyKey,
  signal,
}: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>(ENDPOINTS.otp.verify, {
    method: 'POST',
    body: { sessionId, otp },
    idempotencyKey,
    signal,
    skipAuth: true,
  });
}
