import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';

function pickParticipantId(row: Record<string, unknown>): string | null {
  const nested = row.user;
  if (
    nested !== undefined &&
    nested !== null &&
    typeof nested === 'object' &&
    !Array.isArray(nested)
  ) {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim() !== '') return id.trim();
  }
  if (typeof row.userId === 'string' && row.userId.trim() !== '') return row.userId.trim();
  if (typeof row.id === 'string' && row.id.trim() !== '') return row.id.trim();
  return null;
}

export function expenseDetailSplitTypeToForm(raw: string): ExpenseSplitType {
  const n = raw.trim().toLowerCase();
  if (n === 'custom' || n === 'custom_amount' || n === 'exact') return 'exact';
  if (n === 'percent' || n === 'percentage') return 'percentage';
  if (n === 'shares' || n === 'share') return 'shares';
  if (n === 'adjust' || n === 'adjustment') return 'adjust';
  return 'equal';
}

export type HydratedSplitSeed = {
  splitType: ExpenseSplitType;
  exactByUserId: Record<string, string>;
  percentByUserId: Record<string, string>;
  sharesByUserId: Record<string, number>;
};

/**
 * Derives local split state from `ExpenseDetail` for pre-filling the add-expense UI in edit mode.
 * Unknown `splitType` values default to `equal`. **`adjust`** is approximated as **`exact`** using
 * per-line amounts (the add-expense split sheet has no adjust tab).
 */
export function buildHydratedSplitSeed(detail: ExpenseDetail): HydratedSplitSeed {
  const d = detail as Record<string, unknown>;
  const rawSplit = typeof d.splitType === 'string' ? d.splitType : '';
  const wireSplitType = expenseDetailSplitTypeToForm(rawSplit);

  const exactByUserId: Record<string, string> = {};
  const percentByUserId: Record<string, string> = {};
  const sharesByUserId: Record<string, number> = {};

  const rows = detail.participants as unknown[];
  for (const raw of rows) {
    if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw))
      continue;
    const row = raw as Record<string, unknown>;
    const id = pickParticipantId(row);
    if (!id) continue;

    const owedRaw = row.owedAmount ?? row.shareAmount ?? row.amountOwed ?? row.share ?? row.amount;
    const amt =
      typeof owedRaw === 'string'
        ? owedRaw.replace(/,/g, '').trim()
        : typeof owedRaw === 'number'
          ? String(owedRaw)
          : '';
    if (amt !== '') exactByUserId[id] = amt;

    const pct = row.percent ?? row.percentage ?? row.sharePercent;
    if (typeof pct === 'number' && Number.isFinite(pct)) {
      percentByUserId[id] = String(pct);
    } else if (typeof pct === 'string' && pct.trim() !== '') {
      percentByUserId[id] = pct.replace(/,/g, '').trim();
    }

    const sh = row.shares ?? row.shareCount ?? row.weight;
    if (typeof sh === 'number' && Number.isFinite(sh) && sh > 0) {
      sharesByUserId[id] = Math.round(sh);
    } else if (typeof sh === 'string' && sh.trim() !== '') {
      const n = Number(sh.replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) sharesByUserId[id] = Math.round(n);
    }

    const adj = row.adjustment ?? row.adjustAmount ?? row.fixedAmount;
    const adjStr =
      typeof adj === 'string'
        ? adj.replace(/,/g, '').trim()
        : typeof adj === 'number'
          ? String(adj)
          : '';
    if (adjStr !== '' && wireSplitType === 'adjust') {
      exactByUserId[id] = adjStr;
    }
  }

  if (wireSplitType === 'adjust') {
    const keys = Object.keys(exactByUserId);
    return {
      splitType: keys.length > 0 ? 'exact' : 'equal',
      exactByUserId: keys.length > 0 ? exactByUserId : {},
      percentByUserId: {},
      sharesByUserId: {},
    };
  }

  return {
    splitType: wireSplitType,
    exactByUserId: wireSplitType === 'exact' ? exactByUserId : {},
    percentByUserId: wireSplitType === 'percentage' ? percentByUserId : {},
    sharesByUserId: wireSplitType === 'shares' ? sharesByUserId : {},
  };
}
