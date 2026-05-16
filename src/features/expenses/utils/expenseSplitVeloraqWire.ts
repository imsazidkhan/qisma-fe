import type {
  ExpenseSplitPayload,
  VeloraqExpenseSplitWire,
} from '@/features/expenses/types/expense.types';

function userIdFromLine(participantUserIds: string[]): string | null {
  const id = participantUserIds[0];
  return id && id.trim() !== '' ? id : null;
}

/**
 * Maps client line-based `ExpenseSplitPayload` → Veloraq create/patch `split` (record-based DTO).
 * Client `type: 'adjust'` → wire `splitType: 'adjustment'` with `fixedAmountsByUserId` + `remainderUserIds`.
 */
export function toVeloraqExpenseSplitWire(split: ExpenseSplitPayload): VeloraqExpenseSplitWire {
  switch (split.type) {
    case 'equal':
      return { splitType: 'equal', participantUserIds: split.participantUserIds };
    case 'exact': {
      const amountsByUserId: Record<string, string> = {};
      for (const l of split.lines) {
        const id = userIdFromLine(l.participantUserIds);
        if (id) amountsByUserId[id] = l.amount;
      }
      return { splitType: 'exact', amountsByUserId };
    }
    case 'percentage': {
      const percentageByUserId: Record<string, string> = {};
      for (const l of split.lines) {
        const id = userIdFromLine(l.participantUserIds);
        if (id) percentageByUserId[id] = String(l.percent);
      }
      return { splitType: 'percentage', percentageByUserId };
    }
    case 'shares': {
      const sharesByUserId: Record<string, string> = {};
      for (const l of split.lines) {
        const id = userIdFromLine(l.participantUserIds);
        if (id) sharesByUserId[id] = String(l.shares);
      }
      return { splitType: 'shares', sharesByUserId };
    }
    case 'adjust': {
      const rem = split.remainderUserId.trim();
      const fixedAmountsByUserId: Record<string, string> = {};
      for (const l of split.lines) {
        const id = userIdFromLine(l.participantUserIds);
        if (!id || id === rem) continue;
        fixedAmountsByUserId[id] = l.amount;
      }
      return {
        splitType: 'adjustment',
        fixedAmountsByUserId,
        remainderUserIds: rem !== '' ? [rem] : [],
      };
    }
    default: {
      const _exhaustive: never = split;
      return _exhaustive;
    }
  }
}
