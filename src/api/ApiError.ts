/**
 * Typed error thrown by every `apiFetch` failure. All UI / hooks should
 * `catch` this and switch on `error.code`, NOT on `error.message` (server
 * messages are not a UI contract — see docs/DESIGN_RULES.md).
 *
 * `status` mirrors the HTTP status when the failure came from the server,
 * or `0` for client-side failures (network, timeout, parse).
 */
export type ApiErrorPayload = {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
  details?: string[];
  requestId?: string;
  /** Original cause — Error for network failures, Response for parse failures, etc. */
  cause?: unknown;
};

export class ApiError extends Error implements ApiErrorPayload {
  readonly code: string;
  readonly status: number;
  readonly retryAfter?: number;
  readonly details?: string[];
  readonly requestId?: string;

  constructor(payload: ApiErrorPayload) {
    // Single-arg `super` only: Hermes / older RN runtimes may not support
    // `new Error(message, { cause })` the same as modern browsers.
    super(payload.message);
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.retryAfter = payload.retryAfter;
    this.details = payload.details;
    this.requestId = payload.requestId;
    if (payload.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = payload.cause;
    }
  }

  /** True for `code` values that should never trigger an automatic retry. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

// ── Client-side error codes (when `status === 0`) ────────────────────
export const CLIENT_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  PARSE_ERROR: 'PARSE_ERROR',
  CANCELLED: 'CANCELLED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
