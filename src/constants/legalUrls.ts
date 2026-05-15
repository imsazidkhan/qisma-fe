/**
 * Optional public legal URLs — set in build env when Terms / Privacy are hosted.
 * When empty, footnotes render as static text (current copy-only behaviour).
 */
export const LEGAL_TERMS_URL = process.env.EXPO_PUBLIC_LEGAL_TERMS_URL?.trim() ?? '';
export const LEGAL_PRIVACY_URL = process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL?.trim() ?? '';
