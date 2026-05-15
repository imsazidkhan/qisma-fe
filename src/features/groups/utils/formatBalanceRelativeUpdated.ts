import type { TFunction } from 'i18next';

/** Relative label for balance snapshot `updatedAt` — compact meta lines on balance rows. */
export function formatBalanceRelativeUpdated(iso: string | undefined, t: TFunction): string {
  const s = iso?.trim() ?? '';
  if (!s) {
    return t('groups.detail.balanceUpdatedUnknown');
  }
  const then = new Date(s).getTime();
  if (Number.isNaN(then)) {
    return t('groups.detail.balanceUpdatedUnknown');
  }
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 45) {
    return t('groups.detail.balanceUpdatedJustNow');
  }
  const min = Math.round(sec / 60);
  if (min < 60) {
    return t('groups.detail.balanceUpdatedMinutes', { count: Math.max(1, min) });
  }
  const hrs = Math.round(min / 60);
  if (hrs < 48) {
    return t('groups.detail.balanceUpdatedHours', { count: Math.max(1, hrs) });
  }
  const days = Math.round(hrs / 24);
  if (days < 14) {
    return t('groups.detail.balanceUpdatedDays', { count: Math.max(1, days) });
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(then));
}
