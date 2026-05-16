import type {
  ExpenseSplitPayload,
  ExpenseSplitType,
  SplitValidationState,
} from '@/features/expenses/types/expense.types';
import { parseAmountToMinor, minorToMajorString } from '@/features/expenses/utils/amountParsing';

export type LocalSplitFormState = {
  splitType: ExpenseSplitType;
  /** Selected members included in the split (wire: `split.participantUserIds` or line `participantUserIds`). */
  participantUserIds: readonly string[];
  /** Normalized major amount string (e.g. `12.50`) */
  totalAmountMajor: string;
  currency: string;
  exactByUserId: Readonly<Record<string, string>>;
  percentByUserId: Readonly<Record<string, string>>;
  sharesByUserId: Readonly<Record<string, number>>;
  adjustFixedByUserId: Readonly<Record<string, string>>;
  adjustRemainderUserId: string | null | undefined;
};

function roundPercentUi(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function computeLocalSplitValidation(input: LocalSplitFormState): SplitValidationState {
  const totalMinor = parseAmountToMinor(input.totalAmountMajor);
  if (totalMinor === null) {
    return { kind: 'incomplete', labelKey: 'expenses.add.validation.enterAmount' };
  }

  const ids = [...input.participantUserIds];
  if (ids.length === 0) {
    return { kind: 'incomplete', labelKey: 'expenses.add.validation.pickParticipants' };
  }

  switch (input.splitType) {
    case 'equal':
      return { kind: 'perfect' };
    case 'exact': {
      let sum = 0;
      for (const id of ids) {
        const m = parseAmountToMinor(input.exactByUserId[id] ?? '');
        if (m === null) {
          return { kind: 'remaining', amountMinor: totalMinor - sum, currency: input.currency };
        }
        sum += m;
      }
      if (sum === totalMinor) return { kind: 'perfect' };
      if (sum > totalMinor)
        return { kind: 'over', amountMinor: sum - totalMinor, currency: input.currency };
      return { kind: 'remaining', amountMinor: totalMinor - sum, currency: input.currency };
    }
    case 'percentage': {
      const eps = 1e-6;
      let sum = 0;
      let hasEmpty = false;
      for (const id of ids) {
        const raw = (input.percentByUserId[id] ?? '').replace(/,/g, '').trim();
        if (!raw) {
          hasEmpty = true;
          continue;
        }
        const p = Number(raw);
        if (!Number.isFinite(p)) {
          return { kind: 'incomplete', labelKey: 'expenses.add.validation.percentInvalid' };
        }
        if (p < -eps) {
          return { kind: 'incomplete', labelKey: 'expenses.add.validation.percentInvalid' };
        }
        if (p > 100 + eps) {
          return { kind: 'incomplete', labelKey: 'expenses.add.validation.percentRowExceeds100' };
        }
        sum += p;
      }
      sum = roundPercentUi(sum);
      if (sum > 100 + eps) {
        return { kind: 'percent_over', overBy: roundPercentUi(sum - 100) };
      }
      if (hasEmpty) {
        const remaining = roundPercentUi(Math.max(0, 100 - sum));
        return { kind: 'percent_partial', sumAssigned: sum, remainingToHundred: remaining };
      }
      if (Math.abs(sum - 100) < eps) {
        return { kind: 'perfect' };
      }
      return { kind: 'percent_gap', gapPercent: roundPercentUi(100 - sum) };
    }
    case 'shares': {
      for (const id of ids) {
        const raw = input.sharesByUserId[id];
        if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
          return { kind: 'incomplete', labelKey: 'expenses.add.validation.sharesInvalid' };
        }
      }
      return { kind: 'perfect' };
    }
    case 'adjust': {
      const remainder = input.adjustRemainderUserId;
      if (!remainder || !ids.includes(remainder)) {
        return { kind: 'incomplete', labelKey: 'expenses.add.validation.pickRemainder' };
      }
      let fixedSum = 0;
      for (const id of ids) {
        if (id === remainder) continue;
        const m = parseAmountToMinor(input.adjustFixedByUserId[id] ?? '');
        if (m === null) {
          return {
            kind: 'remaining',
            amountMinor: totalMinor - fixedSum,
            currency: input.currency,
          };
        }
        fixedSum += m;
      }
      if (fixedSum > totalMinor) {
        return { kind: 'over', amountMinor: fixedSum - totalMinor, currency: input.currency };
      }
      const rem = totalMinor - fixedSum;
      if (rem < 0) return { kind: 'over', amountMinor: -rem, currency: input.currency };
      return { kind: 'perfect' };
    }
    default:
      return { kind: 'idle' };
  }
}

export function getSplitValidationMessageKey(v: SplitValidationState): string {
  if (v.kind === 'perfect') return '';
  if (v.kind === 'idle') return 'expenses.add.validation.splitMismatch';
  if (v.kind === 'incomplete') return v.labelKey;
  if (v.kind === 'remaining') return '';
  if (v.kind === 'over') return 'expenses.add.validation.exceededTotal';
  if (v.kind === 'percent_gap') return 'expenses.add.validation.percentBelow100Total';
  if (v.kind === 'percent_partial') return 'expenses.add.validation.percentFillAllRowsBalance';
  if (v.kind === 'percent_over') return 'expenses.add.validation.percentOver';
  return 'expenses.add.validation.splitMismatch';
}

export function validateLocalSplitForm(
  state: LocalSplitFormState,
): { ok: true; split: ExpenseSplitPayload } | { ok: false; messageKey: string } {
  const v = computeLocalSplitValidation(state);
  if (v.kind !== 'perfect') {
    return {
      ok: false,
      messageKey:
        v.kind === 'remaining'
          ? 'expenses.add.modern.submitHintMissingSplit'
          : getSplitValidationMessageKey(v),
    };
  }
  const ids = [...state.participantUserIds];
  const lineIds = (userId: string): string[] => [userId];
  switch (state.splitType) {
    case 'equal':
      return { ok: true, split: { type: 'equal', participantUserIds: ids } };
    case 'exact': {
      const lines = ids.map((userId) => {
        const m = parseAmountToMinor(state.exactByUserId[userId] ?? '');
        return {
          participantUserIds: lineIds(userId),
          amount: m === null ? '0.00' : minorToMajorString(m),
        };
      });
      return { ok: true, split: { type: 'exact', lines } };
    }
    case 'percentage': {
      const lines = ids.map((userId) => ({
        participantUserIds: lineIds(userId),
        percent: Number((state.percentByUserId[userId] ?? '0').replace(/,/g, '')),
      }));
      return { ok: true, split: { type: 'percentage', lines } };
    }
    case 'shares': {
      const lines = ids.map((userId) => ({
        participantUserIds: lineIds(userId),
        shares: Math.floor(state.sharesByUserId[userId]!),
      }));
      return { ok: true, split: { type: 'shares', lines } };
    }
    case 'adjust': {
      const totalMinor = parseAmountToMinor(state.totalAmountMajor) ?? 0;
      const r = state.adjustRemainderUserId ?? ids[ids.length - 1] ?? '';
      let fixedSum = 0;
      const lines: { participantUserIds: string[]; amount: string }[] = [];
      for (const userId of ids) {
        if (userId === r) continue;
        const m = parseAmountToMinor(state.adjustFixedByUserId[userId] ?? '');
        const minor = m ?? 0;
        fixedSum += minor;
        lines.push({
          participantUserIds: lineIds(userId),
          amount: minorToMajorString(minor),
        });
      }
      lines.push({
        participantUserIds: lineIds(r),
        amount: minorToMajorString(Math.max(0, totalMinor - fixedSum)),
      });
      return { ok: true, split: { type: 'adjust', lines, remainderUserId: r } };
    }
    default:
      return { ok: true, split: { type: 'equal', participantUserIds: ids } };
  }
}
