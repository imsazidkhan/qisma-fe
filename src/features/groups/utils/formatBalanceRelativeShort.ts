import type { TFunction } from 'i18next';

const startOfLocalDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Compact timeline fragment for row meta (e.g. `4m ago`, `today`) — no “Updated” prefix.
 */
export function formatBalanceRelativeShort(iso: string | undefined, t: TFunction): string {
  const s = iso?.trim() ?? '';
  if (!s) {
    return t('groups.detail.balanceUpdatedUnknown');
  }
  const then = new Date(s);
  const ms = then.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.detail.balanceUpdatedUnknown');
  }

  const t0 = startOfLocalDay(then);
  const n0 = startOfLocalDay(new Date());
  const diffDays = Math.round((n0.getTime() - t0.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return t('groups.detail.balanceRelativeToday');
  }
  if (diffDays === 1) {
    return t('groups.detail.balanceRelativeYesterday');
  }

  const sec = Math.round((Date.now() - ms) / 1000);
  if (sec < 45) {
    return t('groups.detail.balanceRelativeJustNow');
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
  }).format(then);
}
