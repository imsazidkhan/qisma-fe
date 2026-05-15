import { z } from 'zod';

/** Author/user snippet on `ExpenseCommentEntryDto`. */
export const expenseCommentUserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    avatar: z.string().nullable(),
  })
  .passthrough();

/** Legacy preview rows may still nest `author` instead of `user`. */
export const expenseCommentAuthorSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  })
  .passthrough();

export type ExpenseCommentUser = z.infer<typeof expenseCommentUserSchema>;

const uuidOrNull = z.union([z.string().uuid(), z.null()]);

export const expenseCommentEntrySchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    message: z.string(),
    parentCommentId: uuidOrNull.optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    user: expenseCommentUserSchema.optional(),
    author: expenseCommentAuthorSchema.optional(),
  })
  .passthrough()
  .transform((row) => {
    const userRaw = row.user ?? row.author;
    if (!userRaw || typeof userRaw !== 'object') {
      throw new Error('Expense comment missing `user`/`author` snippet.');
    }
    const u = userRaw as Record<string, unknown>;
    const id = typeof u.id === 'string' ? u.id : '';
    if (!id) throw new Error('Expense comment user snippet missing id.');
    const user: ExpenseCommentUser = {
      id,
      name: typeof u.name === 'string' || u.name === null ? (u.name as string | null) : null,
      username:
        typeof u.username === 'string' || u.username === null
          ? (u.username as string | null)
          : null,
      avatar:
        typeof u.avatar === 'string' || u.avatar === null ? (u.avatar as string | null) : null,
    };
    return {
      id: row.id,
      userId: row.userId,
      message: row.message,
      parentCommentId: row.parentCommentId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? row.createdAt,
      user,
    };
  });

export type ExpenseCommentEntry = z.infer<typeof expenseCommentEntrySchema>;

export type AddExpenseCommentRequestBody = {
  message: string;
  parentCommentId?: string;
};

export type PatchExpenseCommentRequestBody = {
  message: string;
};

export type DeleteExpenseCommentResponse = {
  commentId: string;
  deletedAt: string;
};

export type ListExpenseCommentsResponse = {
  items: ExpenseCommentEntry[];
  nextCursor: string | null;
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

export function parseListExpenseCommentsResponse(data: unknown): ListExpenseCommentsResponse {
  if (data === null || typeof data !== 'object') {
    throw new Error('Invalid list expense comments response: not an object.');
  }
  const o = data as Record<string, unknown>;
  const rawItems = o.items;
  if (!Array.isArray(rawItems)) {
    throw new Error('Invalid list expense comments response: missing items array.');
  }
  const items = rawItems.map((row) => parseExpenseCommentEntry(row));
  const nextCursor =
    o.nextCursor === null || o.nextCursor === undefined
      ? null
      : typeof o.nextCursor === 'string'
        ? o.nextCursor
        : null;
  return { items, nextCursor };
}
