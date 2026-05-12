import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';

import { StatusDot } from '@/components/ui';
import { loginScreenStyles as styles } from '@/features/auth/components/login/loginScreen.styles';
import type { UiUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import { useThemeColors } from '@/theme';

type Props = {
  error: UiUpdateProfileError | null;
};

export function OnboardingNameErrorBanner({ error }: Props) {
  const palette = useThemeColors();
  const { t } = useTranslation();

  const message = useMemo(() => {
    if (!error) return null;
    if (error.validationDetail) return error.validationDetail;
    return t(error.messageKey, { defaultValue: error.fallbackMessage });
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
