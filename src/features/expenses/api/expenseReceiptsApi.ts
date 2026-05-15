import { Platform } from 'react-native';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import { resolveApiBaseUrl } from '@/api/resolveApiBaseUrl';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { getDeviceId } from '@/services';
import {
  EXPENSE_RECEIPT_CLIENT_CODES,
  normalizeExpenseReceiptMimeType,
  validateExpenseReceiptForUpload,
  type ExpenseReceiptClientCode,
} from '@/features/expenses/constants/expenseReceiptUpload';
import {
  parseExpenseAttachmentEntry,
  type ExpenseAttachmentEntry,
  type UploadExpenseReceiptFile,
} from '@/features/expenses/types/expenseAttachment.types';

const MOCK_FLAG = process.env.EXPO_PUBLIC_MOCK_EXPENSES === '1';

const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? '0.0.0';

let cachedBaseUrl: string | undefined;
function apiBaseUrl(): string {
  if (!cachedBaseUrl) cachedBaseUrl = resolveApiBaseUrl();
  return cachedBaseUrl;
}

function authHeaders(): Record<string, string> {
  const { accessToken, tokenType } = useAuthSessionStore.getState();
  if (!accessToken) return {};
  const scheme = tokenType ?? 'Bearer';
  return { Authorization: `${scheme} ${accessToken}` };
}

type SuccessEnvelope<T> = { success: true; data: T };
type ErrorEnvelope = {
  success: false;
  error: { code: string; message: string; retryAfter?: number; details?: string[] };
};
type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { success?: unknown; data?: unknown; error?: unknown };
  if (v.success === true) return true;
  if (v.success === false && typeof v.error === 'object' && v.error !== null) return true;
  return false;
}

function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function mockUploadExpenseReceipt(
  expenseId: string,
  file: UploadExpenseReceiptFile,
  onProgress?: (ratio: number) => void,
): Promise<ExpenseAttachmentEntry> {
  void expenseId;
  const pre = validateExpenseReceiptForUpload(file.mimeType, file.fileSizeBytes);
  if (!pre.ok) {
    throwReceiptValidation(pre.code);
  }
  onProgress?.(0.05);
  await new Promise((r) => setTimeout(r, 120));
  onProgress?.(0.45);
  await new Promise((r) => setTimeout(r, 120));
  onProgress?.(0.85);
  await new Promise((r) => setTimeout(r, 120));
  onProgress?.(1);
  const now = new Date().toISOString();
  const mime = normalizeExpenseReceiptMimeType(file.mimeType);
  const type: ExpenseAttachmentEntry['type'] = mime === 'application/pdf' ? 'pdf' : 'image';
  return {
    id: randomUuid(),
    type,
    url: `https://mock.example/receipts/${randomUuid()}`,
    createdAt: now,
  };
}

function throwReceiptValidation(code: ExpenseReceiptClientCode): never {
  throw new ApiError({
    code,
    message:
      code === EXPENSE_RECEIPT_CLIENT_CODES.TYPE_NOT_ALLOWED
        ? 'Receipt must be JPEG, PNG, WebP, GIF, or PDF.'
        : 'Receipt exceeds maximum file size.',
    status: 0,
  });
}

export function parseExpenseAttachmentResponse(data: unknown): ExpenseAttachmentEntry {
  try {
    return parseExpenseAttachmentEntry(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Invalid expense attachment response shape.';
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message,
      status: 0,
    });
  }
}

export function mapExpenseReceiptUploadError(err: unknown): {
  titleKey: string;
  messageKey: string;
} {
  if (err instanceof ApiError) {
    if (err.code === EXPENSE_RECEIPT_CLIENT_CODES.TYPE_NOT_ALLOWED) {
      return {
        titleKey: 'expenses.receiptsUpload.errorTitle',
        messageKey: 'expenses.receiptsUpload.errorType',
      };
    }
    if (err.code === EXPENSE_RECEIPT_CLIENT_CODES.TOO_LARGE) {
      return {
        titleKey: 'expenses.receiptsUpload.errorTitle',
        messageKey: 'expenses.receiptsUpload.errorTooLarge',
      };
    }
    return {
      titleKey: 'expenses.receiptsUpload.errorTitle',
      messageKey: 'expenses.receiptsUpload.errorGeneric',
    };
  }
  return {
    titleKey: 'expenses.receiptsUpload.errorTitle',
    messageKey: 'expenses.receiptsUpload.errorGeneric',
  };
}

async function buildExpenseReceiptFormData(
  file: UploadExpenseReceiptFile,
  signal?: AbortSignal,
): Promise<FormData> {
  const form = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(file.uri, { signal });
    if (!res.ok) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Could not read the selected file. Try again.',
        status: res.status,
      });
    }
    const blob = await res.blob();
    const mime = normalizeExpenseReceiptMimeType(
      file.mimeType || blob.type || 'application/octet-stream',
    );
    const checked = validateExpenseReceiptForUpload(mime, blob.size);
    if (!checked.ok) {
      throwReceiptValidation(checked.code);
    }
    const fileName = file.fileName || 'receipt';
    if (typeof File !== 'undefined') {
      form.append('file', new File([blob], fileName, { type: checked.mimeType }));
    } else {
      form.append('file', blob, fileName);
    }
  } else {
    const mime = normalizeExpenseReceiptMimeType(file.mimeType);
    const checked = validateExpenseReceiptForUpload(mime, file.fileSizeBytes);
    if (!checked.ok) {
      throwReceiptValidation(checked.code);
    }
    form.append('file', {
      uri: file.uri,
      name: file.fileName,
      type: file.mimeType,
    } as unknown as Blob);
  }

  return form;
}

async function xhrPostExpenseReceiptEnvelope(
  groupId: string,
  expenseId: string,
  form: FormData,
  options: {
    signal?: AbortSignal;
    timeoutMs: number;
    onProgress?: (ratio: number) => void;
  },
): Promise<unknown> {
  const { signal, timeoutMs, onProgress } = options;
  const url = `${apiBaseUrl()}${ENDPOINTS.expenses.groupExpenseReceipts(groupId, expenseId)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const fail = (err: ApiError): void => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const ok = (data: unknown): void => {
      if (settled) return;
      settled = true;
      resolve(data);
    };

    const timeoutId = setTimeout(() => {
      xhr.abort();
      fail(
        new ApiError({
          code: CLIENT_ERROR_CODES.TIMEOUT,
          message: 'The request took too long. Check your connection and try again.',
          status: 0,
        }),
      );
    }, timeoutMs);

    const onAbort = (): void => {
      xhr.abort();
      fail(
        new ApiError({
          code: CLIENT_ERROR_CODES.CANCELLED,
          message: 'Request was cancelled.',
          status: 0,
        }),
      );
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    xhr.open('POST', url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-App-Version', APP_VERSION);
    xhr.setRequestHeader('X-App-Platform', Platform.OS);
    xhr.setRequestHeader('X-Device-Id', getDeviceId());
    for (const [k, v] of Object.entries(authHeaders())) {
      xhr.setRequestHeader(k, v);
    }

    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return;
      if (evt.lengthComputable && evt.total > 0) {
        onProgress(Math.min(1, evt.loaded / evt.total));
      } else {
        onProgress(0.5);
      }
    };

    xhr.onerror = () => {
      clearTimeout(timeoutId);
      fail(
        new ApiError({
          code: CLIENT_ERROR_CODES.NETWORK_ERROR,
          message: 'Network request failed. Check your connection and try again.',
          status: 0,
        }),
      );
    };

    xhr.onload = () => {
      clearTimeout(timeoutId);
      const requestId = xhr.getResponseHeader('x-request-id') ?? undefined;
      let envelope: unknown;
      try {
        envelope = JSON.parse(xhr.responseText) as unknown;
      } catch (cause) {
        fail(
          new ApiError({
            code: CLIENT_ERROR_CODES.PARSE_ERROR,
            message: 'Server returned a non-JSON response.',
            status: xhr.status,
            requestId,
            cause,
          }),
        );
        return;
      }

      if (!isEnvelope(envelope)) {
        fail(
          new ApiError({
            code: CLIENT_ERROR_CODES.PARSE_ERROR,
            message:
              'Server response did not match the expected `{ success, data | error }` shape.',
            status: xhr.status,
            requestId,
          }),
        );
        return;
      }

      if (envelope.success) {
        ok(envelope.data);
        return;
      }

      const retryAfter =
        envelope.error.retryAfter ?? parseRetryAfterHeader(xhr.getResponseHeader('retry-after'));

      fail(
        new ApiError({
          code: envelope.error.code,
          message: envelope.error.message,
          status: xhr.status,
          retryAfter,
          details: envelope.error.details,
          requestId,
        }),
      );
    };

    xhr.send(form as unknown as FormData);
  });
}

/**
 * Same as {@link uploadExpenseReceipt} but reports upload progress (`0..1`) via `onProgress` when the runtime exposes it.
 */
export async function uploadExpenseReceiptWithProgress(
  groupId: string,
  expenseId: string,
  file: UploadExpenseReceiptFile,
  options?: { signal?: AbortSignal; onProgress?: (ratio: number) => void },
): Promise<ExpenseAttachmentEntry> {
  if (MOCK_FLAG) {
    const data = await mockUploadExpenseReceipt(expenseId, file, options?.onProgress);
    return data;
  }
  const form = await buildExpenseReceiptFormData(file, options?.signal);
  options?.onProgress?.(0);
  const raw = await xhrPostExpenseReceiptEnvelope(groupId, expenseId, form, {
    signal: options?.signal,
    timeoutMs: 120_000,
    onProgress: options?.onProgress,
  });
  return parseExpenseAttachmentResponse(raw);
}

/**
 * `POST /v1/groups/:groupId/expenses/:expenseId/receipts` — multipart field **`file`**.
 * Allowed: JPEG, PNG, WebP, GIF, PDF — max **20 MB** (enforced on server; client validates when size is known).
 */
export async function uploadExpenseReceipt(
  groupId: string,
  expenseId: string,
  file: UploadExpenseReceiptFile,
  signal?: AbortSignal,
): Promise<ExpenseAttachmentEntry> {
  if (MOCK_FLAG) {
    return mockUploadExpenseReceipt(expenseId, file);
  }

  const form = await buildExpenseReceiptFormData(file, signal);
  const raw = await apiFetch<unknown>(ENDPOINTS.expenses.groupExpenseReceipts(groupId, expenseId), {
    method: 'POST',
    body: form,
    signal,
    timeoutMs: 120_000,
  });
  return parseExpenseAttachmentResponse(raw);
}
