/**
 * Phone-number helpers for the OTP flow.
 *
 * SCOPE: just enough to ship India (`+91`) cleanly. Adding a region = add an
 * entry to `PHONE_REGIONS` and (optionally) export a region picker. We do NOT
 * pull `libphonenumber-js` here — its 200KB price isn't justified for two
 * regex checks. Revisit when we ship region 3+.
 *
 * **Wire / upload:** Always run user input through {@link tryNormalizeToE164} (or
 * {@link normalizeToE164} when the UI has already validated) before sending `identifier` in API
 * bodies. The group-members `POST` client normalizes `identifier` again at the HTTP edge.
 *
 * **Normalize (IN):** `9999999999` → `+919999999999`; also accepts `919999999999` and pasted `+91` forms via {@link extractNationalDigits} / {@link tryNormalizeToE164}.
 */

export type PhoneRegion = 'IN';

type RegionConfig = {
  /** E.164 country prefix including the leading `+`. */
  countryCode: string;
  /** Required number of national digits. */
  nationalLength: number;
};

const PHONE_REGIONS: Record<PhoneRegion, RegionConfig> = {
  IN: { countryCode: '+91', nationalLength: 10 },
};

/**
 * `^\+?[1-9]\d{9,14}$` — server contract. Used as a final paranoia check
 * after our region-specific validator so a typo in `PHONE_REGIONS` is caught
 * before the request hits the wire.
 */
const E164_REGEX = /^\+?[1-9]\d{9,14}$/;

export function getPhoneRegion(region: PhoneRegion): RegionConfig {
  return PHONE_REGIONS[region];
}

/**
 * Strip every non-digit AND every invisible LTR/RTL/BOM marker that often
 * piggybacks on iMessage / WhatsApp pastes.
 */
export function stripPhoneInput(raw: string): string {
  return raw.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '').replace(/\D/g, '');
}

/**
 * Best-effort national digits for **`IN`** (10-digit mobile): raw `9999999999`,
 * `919999999999`, `09999999999` (strip leading 0), or punctuation between digits.
 * Returns `null` when the string cannot be read as a single Indian mobile national number.
 */
export function extractNationalDigits(raw: string, region: PhoneRegion = 'IN'): string | null {
  const d = stripPhoneInput(raw);
  if (region === 'IN') {
    if (d.length === PHONE_REGIONS.IN.nationalLength) return d;
    if (d.length === 12 && d.startsWith('91')) return d.slice(2);
    if (d.length === 11 && d.startsWith('0')) return d.slice(1);
    return null;
  }
  return null;
}

/**
 * `+91XXXXXXXXXX` when the input is a valid Indian mobile; otherwise **`null`**.
 * Prefer this when conversion can fail; use {@link normalizeToE164} when invalid
 * input should throw.
 */
export function tryNormalizeToE164(raw: string, region: PhoneRegion = 'IN'): string | null {
  const national = extractNationalDigits(raw, region);
  if (!national) return null;
  if (national.startsWith('0')) return null;
  const config = PHONE_REGIONS[region];
  if (national.length !== config.nationalLength) return null;
  const e164 = `${config.countryCode}${national}`;
  if (!E164_REGEX.test(e164)) return null;
  return e164;
}

/**
 * Region-aware validity check. Pure — no UX side effects. Use this to gate
 * the submit button.
 */
export function isValidPhone(raw: string, region: PhoneRegion = 'IN'): boolean {
  return tryNormalizeToE164(raw, region) !== null;
}

/**
 * Build the E.164 string the server expects: `+91XXXXXXXXXX` (e.g. national
 * `9999999999` → `+919999999999`). Throws when the input is not a valid
 * Indian mobile after {@link extractNationalDigits}. The throw is deliberate;
 * failing loudly surfaces a contract bug at the call-site instead of mailing
 * a malformed phone to the backend.
 */
export function normalizeToE164(raw: string, region: PhoneRegion = 'IN'): string {
  const e164 = tryNormalizeToE164(raw, region);
  if (e164 === null) {
    throw new Error('normalizeToE164: phone failed region validation');
  }
  return e164;
}

/**
 * Mask an E.164 number for display in success states / breadcrumbs.
 * `+919876543210` → `+91 ••••• 43210`.
 *
 * Always use this before sending a phone to logs / analytics / Sentry.
 */
export function maskPhoneE164(e164: string): string {
  if (!e164) return '';
  const ccMatch = e164.match(/^\+\d{1,3}/);
  const cc = ccMatch?.[0] ?? '';
  const national = e164.slice(cc.length);
  if (national.length <= 5) return `${cc} ${national}`;
  const tail = national.slice(-5);
  const dotted = '•'.repeat(Math.max(0, national.length - 5));
  return `${cc} ${dotted} ${tail}`;
}
