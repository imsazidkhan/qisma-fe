import { z } from 'zod';

export const expenseCommentAuthorSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  })
  .passthrough();

export const expenseCommentEntrySchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    message: z.string(),
    createdAt: z.string(),
    author: expenseCommentAuthorSchema,
  })
  .passthrough();

export type ExpenseCommentEntry = z.infer<typeof expenseCommentEntrySchema>;
export type ExpenseCommentAuthor = z.infer<typeof expenseCommentAuthorSchema>;

export type AddExpenseCommentRequestBody = {
  message: string;
};

export function parseExpenseCommentEntry(data: unknown): ExpenseCommentEntry {
  const parsed = expenseCommentEntrySchema.safeParse(data);
  if (!parsed.success) {
    const { issues } = parsed.error;
    throw new Error(
      `Invalid expense comment response: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}
