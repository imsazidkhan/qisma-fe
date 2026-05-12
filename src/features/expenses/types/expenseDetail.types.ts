import { z } from 'zod';

const looseObject = z.record(z.string(), z.unknown());

const expenseDetailSchema = z
  .object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    title: z.string(),
    amount: z.string(),
    currency: z.string().length(3),
    date: z.string(),
    paidByUserId: z.string().uuid(),
    createdAt: z.string().optional(),
    category: z.string().optional(),
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
    participants: z.array(looseObject).default([]),
    comments: z.array(looseObject).default([]),
    reactions: z.array(looseObject).default([]),
    attachments: z.array(looseObject).default([]),
    history: z.array(looseObject).default([]),
  })
  .passthrough();

export type ExpenseDetail = z.infer<typeof expenseDetailSchema>;

export function parseExpenseDetail(data: unknown): ExpenseDetail {
  const parsed = expenseDetailSchema.safeParse(data);
  if (!parsed.success) {
    const { issues } = parsed.error;
    throw new Error(
      `Invalid expense detail response: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}
