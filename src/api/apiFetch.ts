import { Platform } from 'react-native';

import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { getDeviceId } from '@/services/deviceId';
import { logger } from '@/services/logger';

import { tryRefreshAfterUnauthorized } from './authRetry';
import { ApiError, CLIENT_ERROR_CODES } from './ApiError';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

/**
 * Auth-service success envelope: `{ success: true, data: T }`.
 * Auth-service error envelope:   `{ success: false, error: { code, message, retryAfter?, details? } }`.
 *
 * `apiFetch<T>` returns the unwrapped `data` on success, throws `ApiError` on failure.
 */
type SuccessEnvelope<T> = { success: true; data: T };
type ErrorEnvelope = {
  success: false;
  error: { code: string; message: string; retryAfter?: number; details?: string[] };
};
type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Object — will be JSON.stringify'd. Leave `undefined` for GET. */
  body?: unknown;
  /** Extra headers — merged with the defaults. */
  headers?: Record<string, string>;
  /** Caller-owned abort signal (e.g. screen unmount). Combined with the timeout. */
  signal?: AbortSignal;
  /** Per-request timeout in ms. Default 15s. */
  timeoutMs?: number;
  /** Sets the `Idempotency-Key` header. Required by `/v1/otp/verify`. */
  idempotencyKey?: string;
  /**
   * Set `true` for auth bootstrap routes (`/otp/*`, `/auth/*`): no `Authorization`
   * header and no 401→`/auth/refresh` retry (avoids loops).
   */
  skipAuth?: boolean;
};

/** Internal: second attempt after a successful refresh (never exported). */
type ApiFetchInternalOptions = ApiFetchOptions & {
  _authRetry?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? '0.0.0';

let cachedBaseUrl: string | undefined;
function getBaseUrl(): string {
  if (!cachedBaseUrl) cachedBaseUrl = resolveApiBaseUrl();
  return cachedBaseUrl;
}

/**
 * One fetch wrapper to rule them all.
 *
 * - Builds the URL by joining `baseUrl + endpoint`.
 * - Adds standard headers (`Content-Type`, `Accept`, `X-App-Version`, `X-App-Platform`,
 *   optional `Authorization` from the auth store unless `skipAuth`, plus `Idempotency-Key` when provided).
 * - On HTTP **401** (protected routes only): refresh tokens once, then retry the request once.
 * - Implements timeout via an internal `AbortController` chained with the caller's signal.
 * - Validates the auth-service envelope shape — throws `ApiError` on `success: false`.
 * - Maps every failure mode (network, timeout, abort, parse, non-envelope, 5xx) to
 *   a typed `ApiError` with a stable `code`.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchInternalOptions = {},
): Promise<T> {
  const {
    method = options.body !== undefined ? 'POST' : 'GET',
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    idempotencyKey,
    skipAuth = false,
    _authRetry = false,
  } = options;

  const url = `${getBaseUrl()}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  // Combine caller's signal with our internal timeout signal.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new TimeoutError()), timeoutMs);
  const onCallerAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        'X-App-Version': APP_VERSION,
        'X-App-Platform': Platform.OS,
        'X-Device-Id': getDeviceId(),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...(!skipAuth ? authHeadersFromStore() : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch (err) {
    throw mapNetworkError(err, signal);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  const requestId = response.headers.get('x-request-id') ?? undefined;

  // Parse JSON. Server sends JSON for both success and error.
  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    if (__DEV__) {
      logger.debug(`[apiFetch] ${method} ${endpoint} HTTP ${response.status} — body is not JSON`);
    }
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Server returned a non-JSON response.',
      status: response.status,
      requestId,
      cause: err,
    });
  }

  // Dev-only: full response body in Metro / terminal (may include sensitive fields — never ship with this relying on prod builds hiding __DEV__).
  if (__DEV__) {
    logger.debug(
      `[apiFetch] ${method} ${endpoint} HTTP ${response.status}`,
      JSON.stringify(envelope, null, 2),
    );
  }

  if (!isEnvelope(envelope)) {
    const details: string[] = [];
    if (looksLikeNestDefaultErrorBody(envelope)) {
      details.push(
        'Response looks like a NestJS default error (often 404). Confirm the API base URL includes `/v1` (e.g. http://HOST:3000/v1).',
      );
    }
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Server response did not match the expected `{ success, data | error }` shape.',
      status: response.status,
      requestId,
      details: details.length > 0 ? details : undefined,
    });
  }

  if (envelope.success) {
    return envelope.data;
  }

  // Server-shaped error. Trust the server `code` and `retryAfter`; fall back to
  // the HTTP `Retry-After` header for non-OTP endpoints that don't include it
  // in the body.
  const retryAfter =
    envelope.error.retryAfter ?? parseRetryAfterHeader(response.headers.get('retry-after'));

  if (!skipAuth && response.status === 401 && !_authRetry) {
    const refreshed = await tryRefreshAfterUnauthorized();
    if (refreshed) {
      return apiFetch<T>(endpoint, { ...options, _authRetry: true });
    }
  }

  throw new ApiError({
    code: envelope.error.code,
    message: envelope.error.message,
    status: response.status,
    retryAfter,
    details: envelope.error.details,
    requestId,
  });
}

function authHeadersFromStore(): Record<string, string> {
  const { accessToken, tokenType } = useAuthSessionStore.getState();
  if (!accessToken) return {};
  const scheme = tokenType ?? 'Bearer';
  return { Authorization: `${scheme} ${accessToken}` };
}

// ── Helpers ───────────────────────────────────────────────────────────

class TimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

function mapNetworkError(err: unknown, callerSignal?: AbortSignal): ApiError {
  // Caller intentionally aborted (screen unmount, navigation away).
  if (callerSignal?.aborted) {
    return new ApiError({
      code: CLIENT_ERROR_CODES.CANCELLED,
      message: 'Request was cancelled.',
      status: 0,
      cause: err,
    });
  }

  // Our internal timeout fired.
  if (err instanceof TimeoutError || (err as Error)?.name === 'TimeoutError') {
    return new ApiError({
      code: CLIENT_ERROR_CODES.TIMEOUT,
      message: 'The request took too long. Check your connection and try again.',
      status: 0,
      cause: err,
    });
  }

  // RN's `fetch` raises `TypeError: Network request failed` when the server is
  // unreachable. Treat any other error here as a network-layer failure.
  return new ApiError({
    code: CLIENT_ERROR_CODES.NETWORK_ERROR,
    message: 'Network request failed. Check your connection and try again.',
    status: 0,
    cause: err,
  });
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { success?: unknown; data?: unknown; error?: unknown };
  if (v.success === true) return true;
  if (v.success === false && typeof v.error === 'object' && v.error !== null) return true;
  return false;
}

/** Nest's non-envelope JSON for 404 / unhandled routes: `{ statusCode, message, error? }`. */
function looksLikeNestDefaultErrorBody(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.statusCode === 'number' && 'message' in v;
}

function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
