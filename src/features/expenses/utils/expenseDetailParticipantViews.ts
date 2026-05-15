import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';

export type ExpenseDetailParticipantView = {
  key: string;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  owedLabel: string;
  paidLabel: string;
  sharePctLabel: string | null;
  isPayer: boolean;
};

function pickString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t !== '' ? t : null;
}

function parseMoneyPair(row: Record<string, unknown>): { owed: string; paid: string } {
  const owedRaw =
    row.owedAmount ?? row.shareAmount ?? row.owed ?? row.amountOwed ?? row.share ?? row.amount;
  const paidRaw = row.paidAmount ?? row.paid ?? row.amountPaid;

  const owed = typeof owedRaw === 'string' || typeof owedRaw === 'number' ? String(owedRaw) : '';
  const paid = typeof paidRaw === 'string' || typeof paidRaw === 'number' ? String(paidRaw) : '';

  return { owed: owed.trim(), paid: paid.trim() };
}

function pickNestedUser(row: Record<string, unknown>): Record<string, unknown> | null {
  const u = row.user;
  if (u !== undefined && u !== null && typeof u === 'object' && !Array.isArray(u)) {
    return u as Record<string, unknown>;
  }
  return null;
}

/**
 * Maps loose API participant rows into stable UI rows — prefers nested `user`, never surfaces raw UUIDs as labels.
 */
export function buildExpenseDetailParticipantViews(
  detail: ExpenseDetail,
  payerUserId: string,
): ExpenseDetailParticipantView[] {
  const currency = detail.currency;
  const totalMajor = Number(String(detail.amount).replace(/,/g, ''));
  const payerNorm = payerUserId.trim().toLowerCase();

  const rows = detail.participants as unknown[];
  const out: ExpenseDetailParticipantView[] = [];

  let index = 0;
  for (const raw of rows) {
    if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const row = raw as Record<string, unknown>;
    const nested = pickNestedUser(row);
    const userId =
      pickString(row.userId) ?? pickString(row.id) ?? (nested ? pickString(nested.id) : null) ?? '';

    if (userId === '') continue;

    const name =
      (nested ? pickString(nested.name) : null) ??
      pickString(row.name) ??
      pickString(row.displayName) ??
      null;

    const username = (nested ? pickString(nested.username) : null) ?? pickString(row.username);

    const avatarUrl =
      (nested ? pickString(nested.avatar ?? nested.avatarUrl) : null) ??
      pickString(row.avatar ?? row.avatarUrl);

    const displayName = name ?? username ?? '';

    const { owed, paid } = parseMoneyPair(row);

    const owedLabel =
      owed !== ''
        ? formatExpenseMajorAmount(owed, currency)
        : formatExpenseMajorAmount('0', currency);
    const paidLabel =
      paid !== ''
        ? formatExpenseMajorAmount(paid, currency)
        : formatExpenseMajorAmount('0', currency);

    let sharePctLabel: string | null = null;
    const owedN = Number(owed.replace(/,/g, ''));
    if (Number.isFinite(owedN) && Number.isFinite(totalMajor) && totalMajor > 0) {
      sharePctLabel = `${Math.round((owedN / totalMajor) * 100)}%`;
    }

    const key = `${userId}:${String(index)}`;
    index += 1;

    out.push({
      key,
      userId,
      name: displayName,
      username,
      avatarUrl,
      owedLabel,
      paidLabel,
      sharePctLabel,
      isPayer: userId.trim().toLowerCase() === payerNorm,
    });
  }

  return out;
}
