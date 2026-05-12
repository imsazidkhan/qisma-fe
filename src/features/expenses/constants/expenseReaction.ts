export const EXPENSE_REACTION_EMOJI_MIN_LENGTH = 1;
export const EXPENSE_REACTION_EMOJI_MAX_LENGTH = 32;

export const EXPENSE_REACTION_CLIENT_CODES = {
  EMPTY: 'EXPENSE_REACTION_EMOJI_EMPTY',
  TOO_LONG: 'EXPENSE_REACTION_EMOJI_TOO_LONG',
} as const;

export type ExpenseReactionClientCode =
  (typeof EXPENSE_REACTION_CLIENT_CODES)[keyof typeof EXPENSE_REACTION_CLIENT_CODES];

export type ExpenseReactionEmojiValidation =
  | { ok: true; emoji: string }
  | { ok: false; code: ExpenseReactionClientCode };

/** Trim; length must be in **[1, 32]** (codepoints as string length — good enough for typical emoji). */
export function validateExpenseReactionEmoji(raw: string): ExpenseReactionEmojiValidation {
  const emoji = raw.trim();
  if (emoji.length < EXPENSE_REACTION_EMOJI_MIN_LENGTH) {
    return { ok: false, code: EXPENSE_REACTION_CLIENT_CODES.EMPTY };
  }
  if (emoji.length > EXPENSE_REACTION_EMOJI_MAX_LENGTH) {
    return { ok: false, code: EXPENSE_REACTION_CLIENT_CODES.TOO_LONG };
  }
  return { ok: true, emoji };
}
