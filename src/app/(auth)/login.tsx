import { selectOtpState, useOtpFlowStore } from '@/features/auth/store';

import { LoginFormCard, LoginOtpCard } from '@/features/auth/components/login';

/**
 * Phone-entry screen — top-level route for `(auth)`.
 *
 *   - `LoginFormCard` → phone + send OTP.
 *   - `LoginOtpCard` → 6-digit verify + resend (when store is `sent`).
 *
 * No route-entry animation — see `docs/DESIGN_RULES.md`.
 */
export default function PhoneEntryScreen() {
  const flowState = useOtpFlowStore(selectOtpState);

  if (flowState.status === 'sent') {
    return (
      <LoginOtpCard
        key={flowState.sessionId}
        phoneE164={flowState.phone}
        sessionId={flowState.sessionId}
        expiresAt={flowState.expiresAt}
        resendAt={flowState.resendAt}
      />
    );
  }

  return <LoginFormCard />;
}
