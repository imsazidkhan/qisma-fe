import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

function formatHeaderStamp(language: string | undefined): string {
  const locale = language?.replace('_', '-') ?? undefined;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

/**
 * Local date + time string for the home header; recomputed when the screen gains focus
 * (no timer — avoids bridge churn and respects tab switches).
 */
export function useHomeDashboardHeaderStamp(): string {
  const { i18n } = useTranslation();
  const [stamp, setStamp] = useState(() => formatHeaderStamp(i18n.language));

  useFocusEffect(
    useCallback(() => {
      setStamp(formatHeaderStamp(i18n.language));
    }, [i18n.language]),
  );

  return stamp;
}
