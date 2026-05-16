import { useEffect, useState } from 'react';

import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';

function mergeStringMap(
  previous: Record<string, string>,
  ids: readonly string[],
  empty: string,
): Record<string, string> {
  const next: Record<string, string> = { ...previous };
  for (const id of ids) {
    if (next[id] === undefined) next[id] = empty;
  }
  for (const k of Object.keys(next)) {
    if (!ids.includes(k)) delete next[k];
  }
  return next;
}

function mergeSharesMap(
  previous: Record<string, number>,
  ids: readonly string[],
): Record<string, number> {
  const next: Record<string, number> = { ...previous };
  for (const id of ids) {
    if (next[id] === undefined) next[id] = 0;
  }
  for (const k of Object.keys(next)) {
    if (!ids.includes(k)) delete next[k];
  }
  return next;
}

export function useExpenseSplitState(
  participantIds: readonly string[],
  options?: { initialSplitType?: ExpenseSplitType },
) {
  const [splitType, setSplitType] = useState<ExpenseSplitType>(
    () => options?.initialSplitType ?? 'equal',
  );
  const [exactByUserId, setExactByUserId] = useState<Record<string, string>>({});
  const [percentByUserId, setPercentByUserId] = useState<Record<string, string>>({});
  const [sharesByUserId, setSharesByUserId] = useState<Record<string, number>>({});
  const [adjustFixedByUserId, setAdjustFixedByUserId] = useState<Record<string, string>>({});
  const [adjustRemainderUserId, setAdjustRemainderUserId] = useState<string | null>(null);

  useEffect(() => {
    setExactByUserId((p) => mergeStringMap(p, participantIds, ''));
    setPercentByUserId((p) => mergeStringMap(p, participantIds, ''));
    setSharesByUserId((p) => mergeSharesMap(p, participantIds));
    setAdjustFixedByUserId((p) => mergeStringMap(p, participantIds, ''));
    setAdjustRemainderUserId((prev) => {
      const last = participantIds[participantIds.length - 1] ?? null;
      if (prev && participantIds.includes(prev)) return prev;
      return last;
    });
  }, [participantIds]);

  return {
    splitType,
    setSplitType,
    exactByUserId,
    setExactByUserId,
    percentByUserId,
    setPercentByUserId,
    sharesByUserId,
    setSharesByUserId,
    adjustFixedByUserId,
    setAdjustFixedByUserId,
    adjustRemainderUserId,
    setAdjustRemainderUserId,
  };
}
