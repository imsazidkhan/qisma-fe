const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative timestamps for comment rails (locale-neutral engineered labels). */
export function formatExpenseCommentRelativeShort(iso: string): string {
  const d = new Date(iso.trim());
  const ms = d.getTime();
  if (Number.isNaN(ms)) return '—';

  const delta = Date.now() - ms;
  if (delta < MINUTE) return 'now';
  if (delta < HOUR) {
    const m = Math.floor(delta / MINUTE);
    return `${m}m`;
  }
  if (delta < DAY) {
    const h = Math.floor(delta / HOUR);
    return `${h}h`;
  }
  const days = Math.floor(delta / DAY);
  if (days < 14) return `${days}d`;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: delta > 365 * DAY ? 'numeric' : undefined,
  }).format(d);
}
