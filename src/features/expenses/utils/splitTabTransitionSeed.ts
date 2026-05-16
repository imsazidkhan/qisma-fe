import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';

export type SplitTabTransitionSeed = {
  exactByUserId?: Record<string, string>;
  percentByUserId?: Record<string, string>;
  sharesByUserId?: Record<string, number>;
};

function clearedStringMap(ids: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    out[id] = '';
  }
  return out;
}

function clearedSharesMap(ids: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    out[id] = 0;
  }
  return out;
}

/**
 * When switching into exact / percentage / shares, always start with empty inputs so
 * values are only what the user types (no copying from other split modes).
 */
export function seedSplitMapsForTabTransition(
  from: ExpenseSplitType,
  to: ExpenseSplitType,
  includedMemberIds: readonly string[],
  _totalMajorSanitized: string,
  _equalPartsMajor: string[] | null,
  _exactByUserId: Readonly<Record<string, string>>,
  _percentByUserId: Readonly<Record<string, string>>,
  _sharesByUserId: Readonly<Record<string, number>>,
): SplitTabTransitionSeed {
  if (from === to) return {};
  if (to === 'equal' || to === 'adjust') return {};
  if (from === 'adjust') return {};
  if (includedMemberIds.length === 0) return {};

  if (to === 'exact') {
    return { exactByUserId: clearedStringMap(includedMemberIds) };
  }
  if (to === 'percentage') {
    return { percentByUserId: clearedStringMap(includedMemberIds) };
  }
  if (to === 'shares') {
    return { sharesByUserId: clearedSharesMap(includedMemberIds) };
  }
  return {};
}
