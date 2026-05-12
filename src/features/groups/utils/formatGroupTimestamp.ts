import type { TFunction } from 'i18next';

const IST = 'Asia/Kolkata';

/** Date in IST as `YYYY-MM-DD` (ICU `en-CA` + Kolkata). */
const dateInIst = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Time in IST, 12-hour with AM/PM. */
const timeInIst = new Intl.DateTimeFormat('en-US', {
  timeZone: IST,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Exact date + time for group/activity surfaces — always **IST**, AM/PM, middle dot. */
export function formatGroupTimestamp(iso: string, t: TFunction): string {
  const s = iso.trim();
  if (!s) {
    return t('groups.activity.unknown');
  }
  const d = new Date(s);
  const ms = d.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.activity.unknown');
  }
  return `${dateInIst.format(d)} · ${timeInIst.format(d)} IST`;
}

const startOfLocalDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Human “created” line for group hub meta (local calendar day).
 */
export function formatGroupCreatedRelative(iso: string, t: TFunction): string {
  const s = iso.trim();
  if (!s) {
    return t('groups.activity.unknown');
  }
  const created = new Date(s);
  const ms = created.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.activity.unknown');
  }

  const c0 = startOfLocalDay(created);
  const n0 = startOfLocalDay(new Date());
  const diffDays = Math.round((n0.getTime() - c0.getTime()) / 86_400_000);

  if (diffDays < 0) {
    const dateShort = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(created);
    return t('groups.detail.hubCreatedOn', { date: dateShort });
  }
  if (diffDays === 0) {
    return t('groups.detail.hubCreatedToday');
  }
  if (diffDays === 1) {
    return t('groups.detail.hubCreatedYesterday');
  }
  if (diffDays > 1 && diffDays < 7) {
    return t('groups.detail.hubCreatedDaysAgo', { count: diffDays });
  }

  const dateShort = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(created);
  return t('groups.detail.hubCreatedOn', { date: dateShort });
}

/** Short local time for activity cards (e.g. 3:45 AM). */
export function formatGroupActivityTime(iso: string, t: TFunction): string {
  const s = iso.trim();
  if (!s) {
    return t('groups.activity.unknown');
  }
  const d = new Date(s);
  const ms = d.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.activity.unknown');
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
