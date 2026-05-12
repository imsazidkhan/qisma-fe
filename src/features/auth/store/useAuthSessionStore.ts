import { create } from 'zustand';

import type { VerifyOtpResponse } from '../types/otp.types';

type AuthSessionState = {
  /** Short-lived JWT — memory only, never persisted. */
  accessToken: string | null;
  expiresIn: number | null;
  tokenType: VerifyOtpResponse['tokenType'] | null;
  setFromTokenPair: (tokens: VerifyOtpResponse) => void;
  clear: () => void;
};

/**
 * In-memory session surface for the access token (and mirror metadata).
 * Refresh token lives in SecureStore only — see `authSession.ts`.
 */
export const useAuthSessionStore = create<AuthSessionState>((set) => ({
  accessToken: null,
  expiresIn: null,
  tokenType: null,

  setFromTokenPair: (tokens) =>
    set({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    }),

  clear: () =>
    set({
      accessToken: null,
      expiresIn: null,
      tokenType: null,
    }),
}));
