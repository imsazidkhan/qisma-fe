import { create } from 'zustand';

import type { UiAuthError } from '../api/parseAuthServiceError';

/**
 * Discriminated union of every state the OTP screen can be in.
 *
 * Modelling it as a union (rather than `{ loading, error, sentSession }` style
 * boolean soup) is the whole point of this store — it makes "what should the
 * UI render?" a single `switch (s.status)`.
 *
 * NEVER persist this slice. `sessionId` is treated as a secret; losing it on
 * app kill is acceptable (the user re-enters their phone).
 */
export type OtpFlowState =
  | { status: 'idle' }
  | { status: 'sending'; phone: string }
  | {
      status: 'sent';
      phone: string;
      sessionId: string;
      /** Absolute ms-epoch when the OTP itself expires. */
      expiresAt: number;
      /** Absolute ms-epoch when the user can request another code (normal /send spacing). */
      resendAt: number;
      /**
       * When server returns `COOLDOWN_ACTIVE` on **resend** — epoch ms before next resend allowed.
       * Keeps user on OTP screen (session intact).
       */
      resendCooldownUntil?: number;
    }
  | {
      status: 'cooldown';
      phone: string;
      /** Absolute ms-epoch when /send becomes callable again. */
      resendAt: number;
    }
  | {
      status: 'rateLimited';
      phone: string;
      reason: 'phone' | 'ip';
      /** Absolute ms-epoch when /send becomes callable again. */
      until: number;
    }
  | { status: 'expired'; phone: string }
  | {
      status: 'error';
      phone?: string;
      code: string;
      messageKey: string;
    };

type Actions = {
  /** Reset to `idle`. Call on screen mount + on "use a different number". */
  reset: () => void;
  /** Transition `* → sending` while the network call is in flight. */
  startSending: (phone: string) => void;
  /** Transition `sending → sent` on a 201. */
  sentOk: (args: {
    phone: string;
    sessionId: string;
    expiresAt: number;
    /** Server-provided cooldown in seconds. Stored as absolute deadline. */
    retryAfterSec: number;
  }) => void;
  /**
   * Transition `sending → cooldown | rateLimited | error` based on the
   * UI-shaped error returned from `parseAuthServiceError`.
   */
  sentFail: (args: { phone: string; uiError: UiAuthError }) => void;
  /** Clear server-imposed resend cooldown chip once the countdown reaches zero. */
  clearResendCooldown: () => void;
  /** Transition `sent → expired` once the absolute `expiresAt` passes. */
  markExpired: () => void;
};

type Store = { state: OtpFlowState } & Actions;

export const useOtpFlowStore = create<Store>((set, get) => ({
  state: { status: 'idle' },

  reset: () => set({ state: { status: 'idle' } }),

  startSending: (phone) => set({ state: { status: 'sending', phone } }),

  sentOk: ({ phone, sessionId, expiresAt, retryAfterSec }) =>
    set({
      state: {
        status: 'sent',
        phone,
        sessionId,
        expiresAt,
        resendAt: Date.now() + retryAfterSec * 1000,
      },
    }),

  sentFail: ({ phone, uiError }) => {
    const retrySec = Math.max(1, uiError.retryAfter);

    if (uiError.code === 'COOLDOWN_ACTIVE') {
      const cur = get().state;
      if (cur.status === 'sent') {
        set({
          state: {
            ...cur,
            resendCooldownUntil: Date.now() + retrySec * 1000,
          },
        });
        return;
      }
      set({
        state: {
          status: 'cooldown',
          phone,
          resendAt: Date.now() + retrySec * 1000,
        },
      });
      return;
    }
    if (uiError.code === 'RATE_LIMITED_PHONE' || uiError.code === 'RATE_LIMITED_IP') {
      const cur = get().state;
      if (cur.status === 'sent') {
        set({
          state: {
            ...cur,
            resendCooldownUntil: Date.now() + retrySec * 1000,
          },
        });
        return;
      }
      set({
        state: {
          status: 'rateLimited',
          phone,
          reason: uiError.code === 'RATE_LIMITED_PHONE' ? 'phone' : 'ip',
          until: Date.now() + retrySec * 1000,
        },
      });
      return;
    }
    set({
      state: {
        status: 'error',
        phone,
        code: uiError.code,
        messageKey: uiError.messageKey,
      },
    });
  },

  clearResendCooldown: () => {
    const cur = get().state;
    if (cur.status !== 'sent' || cur.resendCooldownUntil === undefined) return;
    const { resendCooldownUntil: _removed, ...rest } = cur;
    void _removed;
    set({ state: rest });
  },

  markExpired: () => {
    const current = get().state;
    if (current.status !== 'sent') return;
    set({ state: { status: 'expired', phone: current.phone } });
  },
}));

/** Selector — convenient direct access to the active state. */
export const selectOtpState = (s: { state: OtpFlowState }) => s.state;
