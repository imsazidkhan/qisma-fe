import { z } from 'zod';

const looseObject = z.record(z.string(), z.unknown());

function unwrapExpenseDetailPayload(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === 'string' && o.id.trim() !== '') return raw;
  const expense = o.expense;
  if (
    typeof expense === 'object' &&
    expense !== null &&
    typeof (expense as Record<string, unknown>).id === 'string'
  ) {
    return expense;
  }
  const data = o.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).id === 'string'
  ) {
    return data;
  }
  return raw;
}

/** Normalize payer id from Veloraq `paidByUserId` or embedded `paidBy.id`. */
function coerceExpenseDetailPaidByUserId(raw: unknown): unknown {
  const u = unwrapExpenseDetailPayload(raw);
  if (u === null || typeof u !== 'object') return u;
  const o = { ...(u as Record<string, unknown>) };
  const trimmedPaidBy = typeof o.paidByUserId === 'string' ? o.paidByUserId.trim() : '';
  if (trimmedPaidBy !== '') {
    o.paidByUserId = trimmedPaidBy;
    return o;
  }
  const pb = o.paidBy;
  if (typeof pb === 'object' && pb !== null) {
    const id = (pb as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim() !== '') {
      o.paidByUserId = id.trim();
      return o;
    }
  }
  return o;
}

const looseRowArray = z.preprocess(
  (v) => (v === undefined || v === null ? [] : v),
  z.array(looseObject),
);

const expenseDetailSchema = z
  .object({
    /** Backend may use non-RFC variants — keep validation shallow like the expense feed. */
    id: z.string().min(1),
    groupId: z.string().min(1),
    title: z.preprocess((v) => (v === undefined || v === null ? '' : v), z.coerce.string()),
    amount: z.union([z.string(), z.number(), z.bigint()]).transform((a) => String(a)),
    currency: z.coerce
      .string()
      .transform((s) => s.trim().toUpperCase())
      .pipe(z.string().length(3)),
    date: z.string(),
    paidByUserId: z.string().min(1),
    createdAt: z.string().optional(),
    /** Legacy label string or Veloraq `{ primary, secondary }` envelope — validated downstream. */
    category: z.unknown().optional(),
    categoryId: z.union([z.string(), z.null()]).optional(),
    subcategoryId: z.union([z.string(), z.null()]).optional(),
    merchantId: z.union([z.string(), z.null()]).optional(),
    classificationConfidence: z.union([z.string(), z.null()]).optional(),
    classificationSource: z.union([z.string(), z.null()]).optional(),
    isUserClassified: z.boolean().optional(),
    classifiedAt: z.union([z.string(), z.null()]).optional(),
    recurringDetected: z.boolean().optional(),
    recurringConfidence: z.union([z.string(), z.null()]).optional(),
    recurringGroupId: z.union([z.string(), z.null()]).optional(),
    city: z.union([z.string(), z.null()]).optional(),
    metadata: z.union([z.record(z.string(), z.unknown()), z.null()]).optional(),
    expenseMonth: z.number().optional(),
    expenseYear: z.number().optional(),
    expenseDayOfWeek: z.number().optional(),
    expenseHour: z.number().optional(),
    taxonomyTags: z.array(looseObject).optional(),
    participants: looseRowArray.default([]),
    comments: looseRowArray.default([]),
    reactions: looseRowArray.default([]),
    attachments: looseRowArray.default([]),
    history: looseRowArray.default([]),
  })
  .passthrough();

export type ExpenseDetail = z.infer<typeof expenseDetailSchema>;

export function parseExpenseDetail(data: unknown): ExpenseDetail {
  const normalized = coerceExpenseDetailPaidByUserId(data);
  const parsed = expenseDetailSchema.safeParse(normalized);
  if (!parsed.success) {
    const { issues } = parsed.error;
    throw new Error(
      `Invalid expense detail response: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}
