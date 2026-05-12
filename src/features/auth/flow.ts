/**
 * Auth flows (reference for contributors).
 *
 * **App start**
 * → load refresh token from SecureStore
 * → `POST /v1/auth/refresh` (`bootstrapAuthSession`)
 * → store accessToken in Zustand (memory), refreshToken in SecureStore
 * → navigate (root index → `/home` or `/login`)
 *
 * **Layers** — UI → hooks → auth store (`useAuthSessionStore`) → auth service (`authSession.ts`)
 * → API client (`apiFetch`) → backend.
 *
 * **Login** — phone → `POST /otp/send` → OTP → `POST /otp/verify` → save tokens as above.
 *
 * **Authenticated API** — `apiFetch` attaches `Authorization` unless `skipAuth: true`.
 * On HTTP 401, one refresh + retry of the original request.
 *
 * **Logout** — `POST /auth/logout` (best-effort) → clear SecureStore + reset Zustand → navigate to auth.
 */
export {};
