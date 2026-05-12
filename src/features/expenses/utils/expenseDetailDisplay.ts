function pickStringFromRecord(
  obj: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim() !== '') {
      return v;
    }
  }
  return undefined;
}

export function expenseDetailAuthorSnippet(author: unknown): string | undefined {
  if (!author || typeof author !== 'object') {
    return undefined;
  }
  return pickStringFromRecord(author as Record<string, unknown>, [
    'displayName',
    'name',
    'username',
    'id',
  ]);
}

export function expenseDetailBodyText(row: Record<string, unknown>): string | undefined {
  return pickStringFromRecord(row, ['body', 'text', 'content', 'message']);
}

export function expenseDetailHistoryLine(row: Record<string, unknown>): string | undefined {
  return pickStringFromRecord(row, ['summary', 'message', 'action', 'type', 'description']);
}

export function expenseDetailTitleLine(row: Record<string, unknown>): string | undefined {
  return pickStringFromRecord(row, ['title', 'name', 'label', 'filename', 'mimeType']);
}
