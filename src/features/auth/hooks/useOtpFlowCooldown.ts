import { useEffect, useMemo } from 'react';

import { useCountdownToTimestamp } from '@/hooks';

import type { OtpFlowState } from '@/features/auth/store';

/**
 * Phone-form cooldown / rate-limit: absolute deadlines from the server + a 1s
 * ticker. When the countdown hits 0, calls `onCooldownElapsed` (typically
 * `reset()` so the store leaves `cooldown` / stale rate-limit state).
 */
export function useOtpFlowCooldown(flowState: OtpFlowState, onCooldownElapsed: () => void) {
  const cooldownDeadline = useMemo<number | null>(() => {
    if (flowState.status === 'cooldown') return flowState.resendAt;
    if (flowState.status === 'rateLimited') return flowState.until;
    return null;
  }, [flowState]);

  const cooldownSeconds = useCountdownToTimestamp(cooldownDeadline);

  useEffect(() => {
    if (cooldownDeadline !== null && cooldownSeconds === 0) {
      onCooldownElapsed();
    }
  }, [cooldownDeadline, cooldownSeconds, onCooldownElapsed]);

  const isCooling = cooldownDeadline !== null && cooldownSeconds > 0;

  return { cooldownDeadline, cooldownSeconds, isCooling };
}
