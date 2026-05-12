import { z } from 'zod';

export const expenseAttachmentTypeSchema = z.enum(['image', 'pdf', 'file']);

export const expenseAttachmentEntrySchema = z
  .object({
    id: z.string().uuid(),
    type: expenseAttachmentTypeSchema,
    url: z.string().min(1),
    createdAt: z.string(),
  })
  .passthrough();

export type ExpenseAttachmentEntry = z.infer<typeof expenseAttachmentEntrySchema>;
export type ExpenseAttachmentType = z.infer<typeof expenseAttachmentTypeSchema>;

export function parseExpenseAttachmentEntry(data: unknown): ExpenseAttachmentEntry {
  const parsed = expenseAttachmentEntrySchema.safeParse(data);
  if (!parsed.success) {
    const { issues } = parsed.error;
    throw new Error(
      `Invalid expense attachment response: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}

export type UploadExpenseReceiptFile = {
  uri: string;
  fileName: string;
  /** MIME type of the file (e.g. from picker or blob). */
  mimeType: string;
  /**
   * When available (native asset `fileSize`, or known length), enables client max-size check.
   * Omit only if unknown — server still enforces 20 MB.
   */
  fileSizeBytes?: number;
};
