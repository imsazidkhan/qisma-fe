import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';

import { StatusDot } from '@/components/ui';
import { OTP_ERROR_CODES } from '@/features/auth/types';
import type { UiAuthError } from '@/features/auth/api/parseAuthServiceError';
import { useThemeColors } from '@/theme';

import { loginScreenStyles as styles } from './loginScreen.styles';

export function LoginVerifyErrorBanner({ error }: { error: UiAuthError | null }) {
  const palette = useThemeColors();
  const { t } = useTranslation();

  const message = useMemo(() => {
    if (!error) return null;
    const { messageKey, retryAfter, code } = error;
    const fallback = t('auth.verify.errors.unknown');
    if (
      retryAfter > 0 &&
      (code === OTP_ERROR_CODES.SESSION_LOCKED || code === OTP_ERROR_CODES.VERIFY_RATE_LIMITED)
    ) {
      return t(messageKey, { seconds: retryAfter, defaultValue: fallback });
    }
    return t(messageKey, { defaultValue: fallback });
  }, [error, t]);

  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { borderColor: palette.border }]}
    >
      <StatusDot state="error" />
      <Text style={[styles.bannerText, { color: palette.textPrimary }]} numberOfLines={5}>
        {message}
      </Text>
    </View>
  );
}
