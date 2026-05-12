import type { TFunction } from 'i18next';

const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;
const MS_DAY = 24 * MS_HOUR;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Conversational relative time for group list footers (local calendar).
 */
export function formatGroupLastActivityRelative(iso: string, t: TFunction): string {
  const s = iso.trim();
  if (!s) {
    return t('groups.activity.unknown');
  }
  const d = new Date(s);
  const ms = d.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.activity.unknown');
  }

  const now = Date.now();
  const delta = Math.max(0, now - ms);

  if (delta < MS_MIN) {
    return t('groups.relative.justNow');
  }

  const minutes = Math.floor(delta / MS_MIN);
  if (minutes < 60) {
    return t('groups.relative.minutesAgo', { count: minutes });
  }

  const todayStart = startOfLocalDay(new Date());
  const eventDayStart = startOfLocalDay(d);
  const calendarGapDays = Math.round((todayStart.getTime() - eventDayStart.getTime()) / MS_DAY);

  if (calendarGapDays === 0) {
    const hours = Math.max(1, Math.floor(delta / MS_HOUR));
    return t('groups.relative.hoursAgo', { count: hours });
  }

  if (calendarGapDays === 1) {
    return t('groups.relative.yesterday');
  }

  if (calendarGapDays > 1 && calendarGapDays < 7) {
    return t('groups.relative.daysAgo', { count: calendarGapDays });
  }

  const dateShort = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(d);
  return t('groups.relative.onDate', { date: dateShort });
}
