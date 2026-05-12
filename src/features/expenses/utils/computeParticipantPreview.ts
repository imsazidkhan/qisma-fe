import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { parseAmountToMinor } from '@/features/expenses/utils/amountParsing';
import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';
import { computeMemberAmountMinorForPreview } from '@/features/expenses/utils/splitExpenseSheetBalances';

/**
 * Per-participant snapshot used by the People list and the split preview card
 * on the AddExpense / EditExpense screens. Status reflects whether the row's
 * share is settled (the payer covers themselves), owed to the payer, or still
 * waiting on input from the editor (e.g. blank exact amount).
 */
export type ParticipantPreviewStatus = 'settled' | 'owes' | 'pending';

export type ParticipantPreviewRow = {
  userId: string;
  isPayer: boolean;
  /** Per-row share amount in major units (string for display), or null when not yet allocated. */
  amountMajor: string | null;
  /** Same value as `amountMajor` but in minor units, or null when not yet allocated. */
  amountMinor: number | null;
  status: ParticipantPreviewStatus;
};

export type ParticipantPreviewSummary = {
  rows: ParticipantPreviewRow[];
  /** Sum of allocated minor amounts across rows (skips null entries). */
  allocatedMinor: number;
  /** Total amount in minor units, or null when invalid / empty. */
  totalMinor: number | null;
  /** 0..1 — share of the total currently allocated (clamped). */
  progress: number;
  /** Even-distribution per-person amount in major units when split is `equal`. */
  equalPerPersonMajor: string | null;
};

export type ComputeParticipantPreviewArgs = {
  splitType: ExpenseSplitType;
  includedMemberIds: readonly string[];
  paidByUserId: string;
  totalAmountMajor: string;
  exactByUserId: Readonly<Record<string, string>>;
  percentByUserId: Readonly<Record<string, string>>;
  sharesByUserId: Readonly<Record<string, number>>;
};

function statusForRow(isPayer: boolean, amountMinor: number | null): ParticipantPreviewStatus {
  if (isPayer) return 'settled';
  if (amountMinor === null || amountMinor <= 0) return 'pending';
  return 'owes';
}

export function computeParticipantPreview({
  splitType,
  includedMemberIds,
  paidByUserId,
  totalAmountMajor,
  exactByUserId,
  percentByUserId,
  sharesByUserId,
}: ComputeParticipantPreviewArgs): ParticipantPreviewSummary {
  const totalMinor = parseAmountToMinor(totalAmountMajor);
  const equalParts =
    splitType === 'equal'
      ? computeEqualMajorPerPerson(totalAmountMajor, includedMemberIds.length)
      : null;

  const rows: ParticipantPreviewRow[] = includedMemberIds.map((id, index) => {
    const minor = computeMemberAmountMinorForPreview(
      splitType,
      id,
      index,
      includedMemberIds,
      totalAmountMajor,
      equalParts,
      exactByUserId,
      percentByUserId,
      sharesByUserId,
    );
    const isPayer = id === paidByUserId;
    const major = minor === null ? null : (minor / 100).toFixed(2);
    return {
      userId: id,
      isPayer,
      amountMinor: minor,
      amountMajor: major,
      status: statusForRow(isPayer, minor),
    };
  });

  const allocatedMinor = rows.reduce(
    (sum, r) => (r.amountMinor !== null && r.amountMinor > 0 ? sum + r.amountMinor : sum),
    0,
  );

  const progress =
    totalMinor === null || totalMinor <= 0
      ? 0
      : Math.max(0, Math.min(1, allocatedMinor / totalMinor));

  const equalPerPersonMajor =
    splitType === 'equal' && equalParts && equalParts.length > 0 ? (equalParts[0] ?? null) : null;

  return {
    rows,
    allocatedMinor,
    totalMinor,
    progress,
    equalPerPersonMajor,
  };
}
