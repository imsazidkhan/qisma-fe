import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import {
  EXPENSE_REACTION_CLIENT_CODES,
  validateExpenseReactionEmoji,
} from '@/features/expenses/constants/expenseReaction';
import {
  parseExpenseReactionEntry,
  type AddExpenseReactionRequestBody,
  type ExpenseReactionEntry,
} from '@/features/expenses/types/expenseReaction.types';

const MOCK_FLAG = process.env.EXPO_PUBLIC_MOCK_EXPENSES === '1';

/** Mock idempotency: same `(expenseId, emoji)` returns the same row. */
const mockReactionByExpenseAndEmoji = new Map<string, ExpenseReactionEntry>();

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mockIdempotencyKey(expenseId: string, emoji: string): string {
  return `${expenseId}\0${emoji}`;
}

async function mockCreateExpenseReaction(
  expenseId: string,
  body: AddExpenseReactionRequestBody,
): Promise<ExpenseReactionEntry> {
  await new Promise((r) => setTimeout(r, 200));
  const key = mockIdempotencyKey(expenseId, body.emoji);
  const existing = mockReactionByExpenseAndEmoji.get(key);
  if (existing) {
    return existing;
  }
  const now = new Date().toISOString();
  const userId = '00000000-0000-4000-8000-000000000099';
  const entry: ExpenseReactionEntry = {
    id: randomUuid(),
    userId,
    emoji: body.emoji,
    expenseId,
    createdAt: now,
  };
  mockReactionByExpenseAndEmoji.set(key, entry);
  return entry;
}

function throwInvalidReactionEmoji(
  code: (typeof EXPENSE_REACTION_CLIENT_CODES)[keyof typeof EXPENSE_REACTION_CLIENT_CODES],
): never {
  throw new ApiError({
    code,
    message:
      code === EXPENSE_REACTION_CLIENT_CODES.EMPTY
        ? 'Reaction emoji must be non-empty after trim.'
        : 'Reaction emoji exceeds maximum length.',
    status: 0,
  });
}

export function parseExpenseReactionResponse(data: unknown): ExpenseReactionEntry {
  try {
    return parseExpenseReactionEntry(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid expense reaction response shape.';
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message,
      status: 0,
    });
  }
}

export function mapExpenseReactionError(err: unknown): { titleKey: string; messageKey: string } {
  if (err instanceof ApiError) {
    if (err.code === EXPENSE_REACTION_CLIENT_CODES.EMPTY) {
      return {
        titleKey: 'expenses.reactions.errorTitle',
        messageKey: 'expenses.reactions.validationEmpty',
      };
    }
    if (err.code === EXPENSE_REACTION_CLIENT_CODES.TOO_LONG) {
      return {
        titleKey: 'expenses.reactions.errorTitle',
        messageKey: 'expenses.reactions.validationTooLong',
      };
    }
    return {
      titleKey: 'expenses.reactions.errorTitle',
      messageKey: 'expenses.reactions.errorGeneric',
    };
  }
  return {
    titleKey: 'expenses.reactions.errorTitle',
    messageKey: 'expenses.reactions.errorGeneric',
  };
}

/**
 * `POST /v1/groups/:groupId/expenses/:expenseId/reactions` — body `{ emoji }` (trimmed, 1–32 chars).
 * **201** when a new row is created; **200** idempotent when the same user already reacted with that emoji.
 * Response `data` is `ExpenseReactionEntryDto` in both cases.
 */
export async function createExpenseReaction(
  groupId: string,
  expenseId: string,
  body: AddExpenseReactionRequestBody,
  signal?: AbortSignal,
): Promise<ExpenseReactionEntry> {
  const validated = validateExpenseReactionEmoji(body.emoji);
  if (!validated.ok) {
    throwInvalidReactionEmoji(validated.code);
  }
  const payload: AddExpenseReactionRequestBody = { emoji: validated.emoji };

  if (MOCK_FLAG) {
    return mockCreateExpenseReaction(expenseId, payload);
  }

  const raw = await apiFetch<unknown>(
    ENDPOINTS.expenses.groupExpenseReactions(groupId, expenseId),
    {
      method: 'POST',
      body: payload,
      signal,
    },
  );
  return parseExpenseReactionResponse(raw);
}
