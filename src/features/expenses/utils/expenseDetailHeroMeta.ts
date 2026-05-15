import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

export type ExpenseDetailPaidBySnippet = {
  name: string;
  avatarUrl: string | null;
};

export function pickExpenseDetailPaidBy(detail: ExpenseDetail): ExpenseDetailPaidBySnippet {
  const d = detail as Record<string, unknown>;
  const pb = d.paidBy;
  if (pb !== undefined && pb !== null && typeof pb === 'object' && !Array.isArray(pb)) {
    const o = pb as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const avatarRaw =
      typeof o.avatar === 'string'
        ? o.avatar.trim()
        : typeof o.avatarUrl === 'string'
          ? o.avatarUrl.trim()
          : '';
    const avatarUrl = avatarRaw !== '' ? avatarRaw : null;
    if (name !== '') {
      return { name, avatarUrl };
    }
    const username = typeof o.username === 'string' ? o.username.trim() : '';
    if (username !== '') {
      return { name: `@${username}`, avatarUrl };
    }
  }
  return { name: '', avatarUrl: null };
}

export function pickExpenseDetailNote(detail: ExpenseDetail): string | null {
  const d = detail as Record<string, unknown>;
  const notes = typeof d.notes === 'string' ? d.notes.trim() : '';
  const desc = typeof d.description === 'string' ? d.description.trim() : '';
  const merged = notes !== '' ? notes : desc;
  return merged !== '' ? merged : null;
}
