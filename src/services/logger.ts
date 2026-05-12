/**
 * Thin logging facade. Sentry-ready — when `@sentry/react-native` is wired in,
 * swap the bodies of `breadcrumb` / `captureException` to forward to Sentry.
 *
 * NEVER pass PII (phone numbers, OTPs, sessionIds, JWTs) into context. The
 * caller is responsible for stripping it before calling. See
 * `docs/DESIGN_RULES.md` and the OTP playbook for what counts as PII.
 */

export type LogContext = {
  endpoint?: string;
  errorCode?: string;
  requestId?: string;
  /** Additional non-PII tags. */
  tags?: Record<string, string | number | boolean | undefined>;
};

export const logger = {
  /** Drop a non-error breadcrumb. Use for noteworthy state transitions. */
  breadcrumb(message: string, context?: LogContext): void {
    if (__DEV__) {
      console.log(`[breadcrumb] ${message}`, context ?? '');
    }
    // TODO(sentry): Sentry.addBreadcrumb({ message, data: context });
  },

  /** Capture a handled exception. Stack + tags reach the error backend. */
  captureException(error: unknown, context?: LogContext): void {
    if (__DEV__) {
      console.error('[error]', error, context ?? '');
    }
    // TODO(sentry): Sentry.captureException(error, { tags: { ...context } });
  },

  /** Plain dev-only debug log. Stripped from production bundles. */
  debug(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log(`[debug] ${message}`, ...args);
    }
  },
};
