import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

function pickSplitTypeRaw(detail: ExpenseDetail): string {
  const d = detail as Record<string, unknown>;
  return typeof d.splitType === 'string' ? d.splitType.trim().toLowerCase() : '';
}

/**
 * Muted “non–even split” banner on overview when per-head share isn’t a single number.
 */
export function shouldShowNonEvenSplitOverviewContext(
  detail: ExpenseDetail,
  participantCount: number,
): boolean {
  if (participantCount < 1) return false;
  const raw = pickSplitTypeRaw(detail);
  if (raw === 'equal') return false;
  return raw !== '';
}
