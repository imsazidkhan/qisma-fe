import type {
  ExpenseSplitPayload,
  VeloraqExpenseSplitWire,
} from '@/features/expenses/types/expense.types';

/**
 * Veloraq expense split DTO uses **`splitType`** (never client-side `type`).
 * `adjust` → **`adjustment`**; optional **`itemized`** exists server-side but this app does not emit it yet.
 */
export function toVeloraqExpenseSplitWire(split: ExpenseSplitPayload): VeloraqExpenseSplitWire {
  switch (split.type) {
    case 'equal':
      return { splitType: 'equal', participantUserIds: split.participantUserIds };
    case 'exact':
      return { splitType: 'exact', lines: split.lines };
    case 'percentage':
      return { splitType: 'percentage', lines: split.lines };
    case 'shares':
      return { splitType: 'shares', lines: split.lines };
    case 'adjust':
      return {
        splitType: 'adjustment',
        lines: split.lines,
        remainderUserId: split.remainderUserId,
      };
    default: {
      const _exhaustive: never = split;
      return _exhaustive;
    }
  }
}
