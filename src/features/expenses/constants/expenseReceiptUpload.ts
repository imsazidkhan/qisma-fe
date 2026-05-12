/** Server / controller cap (20 MB). */
export const EXPENSE_RECEIPT_MAX_BYTES = 20 * 1024 * 1024;

export const EXPENSE_RECEIPT_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const EXPENSE_RECEIPT_CLIENT_CODES = {
  TYPE_NOT_ALLOWED: 'EXPENSE_RECEIPT_TYPE_NOT_ALLOWED',
  TOO_LARGE: 'EXPENSE_RECEIPT_TOO_LARGE',
} as const;

export type ExpenseReceiptClientCode =
  (typeof EXPENSE_RECEIPT_CLIENT_CODES)[keyof typeof EXPENSE_RECEIPT_CLIENT_CODES];

export type ExpenseReceiptUploadValidation =
  | { ok: true; mimeType: string }
  | { ok: false; code: ExpenseReceiptClientCode };

export function normalizeExpenseReceiptMimeType(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s === 'image/jpg') {
    return 'image/jpeg';
  }
  return s;
}

/**
 * Client-side checks before multipart upload. Pass `fileSizeBytes` when known (web blob, native picker).
 */
export function validateExpenseReceiptForUpload(
  mimeTypeRaw: string,
  fileSizeBytes: number | undefined,
): ExpenseReceiptUploadValidation {
  const mimeType = normalizeExpenseReceiptMimeType(mimeTypeRaw);
  if (!EXPENSE_RECEIPT_ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, code: EXPENSE_RECEIPT_CLIENT_CODES.TYPE_NOT_ALLOWED };
  }
  if (
    fileSizeBytes !== undefined &&
    Number.isFinite(fileSizeBytes) &&
    fileSizeBytes > EXPENSE_RECEIPT_MAX_BYTES
  ) {
    return { ok: false, code: EXPENSE_RECEIPT_CLIENT_CODES.TOO_LARGE };
  }
  return { ok: true, mimeType };
}
