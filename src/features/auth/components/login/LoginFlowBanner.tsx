import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';

import { StatusDot, type StatusDotState } from '@/components/ui';
import { selectOtpState, useOtpFlowStore } from '@/features/auth/store';
import { useCountdownToTimestamp, useNetworkStatus } from '@/hooks';
import { useThemeColors } from '@/theme';

import { loginScreenStyles as styles } from './loginScreen.styles';

/**
 * Phone-form banner: offline, cooldown, rate-limit, send errors, expired.
 */
export function LoginFlowBanner() {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const { isOnline, isReady } = useNetworkStatus();

  const flowState = useOtpFlowStore(selectOtpState);

  const cooldownDeadline = useMemo<number | null>(() => {
    if (flowState.status === 'cooldown') return flowState.resendAt;
    if (flowState.status === 'rateLimited') return flowState.until;
    return null;
  }, [flowState]);
  const secondsRemaining = useCountdownToTimestamp(cooldownDeadline);

  const message = useMemo(() => {
    if (isReady && !isOnline) return t('auth.phone.offlineBanner');
    switch (flowState.status) {
      case 'cooldown':
        return secondsRemaining > 0
          ? t('auth.phone.errors.cooldown', { seconds: secondsRemaining })
          : null;
      case 'rateLimited':
        if (secondsRemaining <= 0) return null;
        return flowState.reason === 'phone'
          ? t('auth.phone.errors.rateLimitedPhone', {
              seconds: secondsRemaining,
            })
          : t('auth.phone.errors.rateLimitedIp', {
              seconds: secondsRemaining,
            });
      case 'error':
        return t(flowState.messageKey, {
          defaultValue: t('auth.phone.errors.unknown'),
        });
      case 'expired':
        return t('auth.phone.sentExpired');
      default:
        return null;
    }
  }, [flowState, isOnline, isReady, secondsRemaining, t]);

  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);

  if (!message) return null;

  const dotState: StatusDotState =
    flowState.status === 'error' || flowState.status === 'expired'
      ? 'error'
      : !isOnline
        ? 'offline'
        : 'idle';

  const tone =
    flowState.status === 'error' || flowState.status === 'expired'
      ? palette.textPrimary
      : palette.textSecondary;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { borderColor: palette.border }]}
    >
      <StatusDot state={dotState} />
      <Text style={[styles.bannerText, { color: tone }]} numberOfLines={3}>
        {message}
      </Text>
    </View>
  );
}
