const IST_TZ = 'Asia/Kolkata';

export function formatExpenseDetailExpenseDay(dateYmd: string): string {
  const s = dateYmd.trim();
  if (s.length === 0) return '—';

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return s;

  const utcNoon = Date.UTC(y, mo - 1, da, 12, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TZ,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(utcNoon));
}

export function formatExpenseDetailRecordedAt(iso: string): string | null {
  const d = new Date(iso.trim());
  const ms = d.getTime();
  if (Number.isNaN(ms)) return null;

  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return `${clock} IST`;
}
