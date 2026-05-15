import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type HomeDashboardHeaderCopy = {
  stamp: string;
};

function formatHeaderStamp(language: string | undefined, d: Date): string {
  const locale = language?.replace('_', '-') ?? undefined;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function computeStamp(language: string | undefined): string {
  return formatHeaderStamp(language, new Date());
}

/**
 * Local date/time stamp for shared tab headers (locale-aware).
 * Recomputes whenever this route is focused again (e.g. switching back to a tab).
 */
export function useHomeDashboardHeaderCopy(): HomeDashboardHeaderCopy {
  const { i18n } = useTranslation();
  const isFocused = useIsFocused();
  const [copy, setCopy] = useState(() => ({ stamp: computeStamp(i18n.language) }));

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    setCopy({ stamp: computeStamp(i18n.language) });
  }, [isFocused, i18n.language]);

  return copy;
}
