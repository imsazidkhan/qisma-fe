/**
 * Optional public legal / support URLs — set in build env when hosted.
 * When empty, callers should fall back to static copy (current behaviour).
 */
export const LEGAL_TERMS_URL = process.env.EXPO_PUBLIC_LEGAL_TERMS_URL?.trim() ?? '';
export const LEGAL_PRIVACY_URL = process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL?.trim() ?? '';
export const SUPPORT_HELP_CENTER_URL = process.env.EXPO_PUBLIC_HELP_CENTER_URL?.trim() ?? '';
