/**
 * Client shapes for group expense create + balances. Wire payloads align with
 * `POST /v1/groups/:groupId/expenses` — backend may extend fields.
 */

export const EXPENSE_SPLIT_TYPES = ['equal', 'exact', 'percentage', 'shares', 'adjust'] as const;
export type ExpenseSplitType = (typeof EXPENSE_SPLIT_TYPES)[number];

/** JSON-safe split payloads sent to the API (structure mirrors expected DTO variants). */
export type ExpenseSplitPayload =
  | { type: 'equal'; participantUserIds: string[] }
  | {
      type: 'exact';
      lines: { participantUserIds: string[]; amount: string }[];
    }
  | {
      type: 'percentage';
      lines: { participantUserIds: string[]; percent: number }[];
    }
  | {
      type: 'shares';
      lines: { participantUserIds: string[]; shares: number }[];
    }
  | {
      type: 'adjust';
      lines: { participantUserIds: string[]; amount: string }[];
      remainderUserId: string;
    };

/**
 * Veloraq `split` on create/patch — discriminator **`splitType`**, enum per server validation.
 */
export type VeloraqExpenseSplitWire =
  | { splitType: 'equal'; participantUserIds: string[] }
  | {
      splitType: 'exact';
      lines: { participantUserIds: string[]; amount: string }[];
    }
  | {
      splitType: 'percentage';
      lines: { participantUserIds: string[]; percent: number }[];
    }
  | {
      splitType: 'shares';
      lines: { participantUserIds: string[]; shares: number }[];
    }
  | {
      splitType: 'adjustment';
      lines: { participantUserIds: string[]; amount: string }[];
      remainderUserId: string;
    };

/** Wire body for `POST /v1/groups/:groupId/expenses` (`CreateExpenseBodyDto` on the server). */
export type CreateGroupExpenseBody = {
  title: string;
  amount: string;
  paidByUserId: string;
  split: VeloraqExpenseSplitWire;
  /** `YYYY-MM-DD` */
  date: string;
  currency?: string;
  /** Optional server scale / precision hint — shape depends on API. */
  scale?: number | string;
  /** Category / subcategory are inferred server-side from `title` on create. */
  merchantId?: string;
  metadata?: Record<string, unknown>;
  city?: string;
  description?: string;
  notes?: string;
  receiptUrl?: string;
  location?: string;
  isRecurring?: boolean;
};

export type GroupBalancesSnapshot = {
  netByUserId: Record<string, string>;
  edges: { fromUserId: string; toUserId: string; amount: string; currency: string }[];
};

export type ExpenseCore = {
  id: string;
  groupId: string;
  title: string;
  amount: string;
  currency: string;
  date: string;
  paidByUserId: string;
  deletedAt: string | null;
  category?: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  merchantId?: string | null;
  classificationConfidence?: string | null;
  classificationSource?: string | null;
  isUserClassified?: boolean;
  classifiedAt?: string | null;
  recurringDetected?: boolean;
  recurringConfidence?: string | null;
  recurringGroupId?: string | null;
  city?: string | null;
  metadata?: Record<string, unknown> | null;
  expenseMonth?: number | null;
  expenseYear?: number | null;
  expenseDayOfWeek?: number | null;
  expenseHour?: number | null;
  taxonomyTags?: { id: string; slug: string; label: string; color: string }[];
};

export type CreateExpenseResponse = {
  expense: ExpenseCore;
  groupBalances: GroupBalancesSnapshot;
};

/** `PATCH /v1/groups/:groupId/expenses/:expenseId` — `PatchExpenseBodyDto`; every field optional unless server rules apply. */
export type PatchExpenseBody = {
  title?: string;
  amount?: string;
  paidByUserId?: string;
  /** Required when `amount` or `paidByUserId` changes; omit for metadata-only edits. */
  split?: VeloraqExpenseSplitWire;
  /** Optimistic concurrency — mismatch → `EXPENSE_STALE_VERSION` / 409. */
  expectedUpdatedAt?: string;
  date?: string;
  currency?: string;
  scale?: number | string;
  /** Category corrections: prefer `POST …/reclassify` with slugs; do not send relational ids here. */
  merchantId?: string | null;
  metadata?: Record<string, unknown>;
  city?: string;
  description?: string;
  notes?: string;
  receiptUrl?: string;
  location?: string;
  isRecurring?: boolean;
};

/** Same envelope as create. */
export type PatchExpenseResponse = CreateExpenseResponse;

/** Same envelope as create / patch — `expense.deletedAt` set after soft-delete. */
export type DeleteExpenseResponse = CreateExpenseResponse;

export type SplitValidationState =
  | { kind: 'idle' }
  | { kind: 'incomplete'; labelKey: string }
  | { kind: 'remaining'; amountMinor: number; currency: string }
  | { kind: 'percent_gap'; gapPercent: number }
  | { kind: 'percent_over'; overBy: number }
  | { kind: 'perfect' }
  | { kind: 'over'; amountMinor: number; currency: string };
