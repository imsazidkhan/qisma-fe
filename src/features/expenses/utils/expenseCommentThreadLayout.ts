import type { TFunction } from 'i18next';

import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';

const MS_DAY = 86_400_000;
const DAY_KEY_INVALID = '__invalid__';

export type ExpenseCommentThreadListRow =
  | { kind: 'dayDivider'; dayKey: string; label: string }
  | { kind: 'message'; entry: ExpenseCommentEntry };

export function parseExpenseCommentInstant(iso: string): Date | null {
  const d = new Date(iso.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

export function expenseCommentLocalDayKey(at: Date): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate());
}

/**
 * Calendar section label for threaded comments (Today / Yesterday / localized date).
 * `now` is injectable for tests.
 */
export function formatExpenseCommentThreadDayLabel(iso: string, t: TFunction, now: Date): string {
  const created = parseExpenseCommentInstant(iso);
  if (!created) {
    return t('expenses.thread.dayUnknown');
  }

  const c0 = startOfLocalDay(created).getTime();
  const n0 = startOfLocalDay(now).getTime();
  const diffDays = Math.round((n0 - c0) / MS_DAY);

  if (diffDays === 0) {
    return t('expenses.thread.dayToday');
  }
  if (diffDays === 1) {
    return t('expenses.thread.dayYesterday');
  }

  const thisCalendarYear = now.getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: created.getFullYear() !== thisCalendarYear ? 'numeric' : undefined,
  }).format(created);
}

/** Day label for a list row — matches inline dividers (Today / Yesterday / date). */
export function expenseCommentThreadRowToDayLabel(
  row: ExpenseCommentThreadListRow,
  t: TFunction,
  now: Date = new Date(),
): string {
  if (row.kind === 'dayDivider') {
    return row.label;
  }
  return formatExpenseCommentThreadDayLabel(row.entry.createdAt, t, now);
}

/** Localized wall-clock time for a comment row (`createdAt`). */
export function formatExpenseCommentThreadTime(iso: string): string {
  const d = parseExpenseCommentInstant(iso);
  if (!d) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/**
 * Builds flat-list rows with day divider rows before the first comment of each local calendar day.
 */
export function buildExpenseCommentThreadRows(
  entries: ExpenseCommentEntry[],
  t: TFunction,
  now: Date = new Date(),
): ExpenseCommentThreadListRow[] {
  const rows: ExpenseCommentThreadListRow[] = [];
  let previousDayKey: string | null = null;

  for (const entry of entries) {
    const created = parseExpenseCommentInstant(entry.createdAt);
    const dayKey = created ? expenseCommentLocalDayKey(created) : DAY_KEY_INVALID;
    if (dayKey !== previousDayKey) {
      previousDayKey = dayKey;
      rows.push({
        kind: 'dayDivider',
        dayKey,
        label: formatExpenseCommentThreadDayLabel(entry.createdAt, t, now),
      });
    }
    rows.push({ kind: 'message', entry });
  }

  return rows;
}
