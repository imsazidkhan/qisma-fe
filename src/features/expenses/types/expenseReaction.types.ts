import { z } from 'zod';

export const expenseReactionEntrySchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    emoji: z.string(),
    expenseId: z.string().uuid().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export type ExpenseReactionEntry = z.infer<typeof expenseReactionEntrySchema>;

export type AddExpenseReactionRequestBody = {
  emoji: string;
};

export function parseExpenseReactionEntry(data: unknown): ExpenseReactionEntry {
  const parsed = expenseReactionEntrySchema.safeParse(data);
  if (!parsed.success) {
    const { issues } = parsed.error;
    throw new Error(
      `Invalid expense reaction response: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}
