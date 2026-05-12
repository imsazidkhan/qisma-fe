/**
 * Generates an opaque idempotency key for `POST /v1/otp/verify` (max 64 chars).
 * Prefer `crypto.randomUUID()` when the runtime provides it.
 */
export function createVerifyIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
