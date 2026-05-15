import { Ionicons } from '@expo/vector-icons';

export type ExpenseIonIcon = keyof typeof Ionicons.glyphMap;

const API_ICON_ALIAS: Record<string, ExpenseIonIcon> = {
  utensils: 'restaurant-outline',
  'food-dining': 'restaurant-outline',
  restaurant: 'restaurant-outline',
  dining: 'restaurant-outline',
  food: 'restaurant-outline',
  chai: 'cafe-outline',
  tea: 'cafe-outline',
  coffee: 'cafe-outline',
  'chai-shop': 'cafe-outline',
  cafe: 'cafe-outline',
  car: 'car-outline',
  transport: 'car-outline',
  vehicle: 'car-outline',
  bus: 'bus-outline',
  train: 'train-outline',
  plane: 'airplane-outline',
  flight: 'airplane-outline',
  travel: 'airplane-outline',
  hotel: 'bed-outline',
  shopping: 'bag-handle-outline',
  shop: 'bag-handle-outline',
  bag: 'bag-handle-outline',
  cart: 'cart-outline',
  grocery: 'basket-outline',
  entertainment: 'game-controller-outline',
  games: 'game-controller-outline',
  movie: 'film-outline',
  music: 'musical-notes-outline',
  health: 'medkit-outline',
  medical: 'medkit-outline',
  home: 'home-outline',
  'home-living': 'home-outline',
  carpentry: 'hammer-outline',
  woodworking: 'hammer-outline',
  handyman: 'construct-outline',
  renovation: 'construct-outline',
  plumbing: 'water-outline',
  electrical: 'flash-outline',
  utilities: 'flash-outline',
  subscription: 'repeat-outline',
  fee: 'receipt-outline',
  transfer: 'swap-horizontal-outline',
};

export function normalizeExpenseGlyphLookupKey(apiIcon: string): string {
  return apiIcon
    .trim()
    .toLowerCase()
    .replace(/^ionicons:/, '')
    .replace(/^ion:/, '')
    .replace(/_/g, '-');
}

/** Returns a match in Ionicons / alias table, or **`null`**. */
export function lookupIonForGlyphKey(apiIcon: string | null | undefined): ExpenseIonIcon | null {
  if (!apiIcon || typeof apiIcon !== 'string') return null;
  const key = normalizeExpenseGlyphLookupKey(apiIcon);
  if (key === '') return null;

  if (key in Ionicons.glyphMap) return key as ExpenseIonIcon;
  const withOutline = key.endsWith('-outline') || key.endsWith('-sharp') ? key : `${key}-outline`;
  if (withOutline in Ionicons.glyphMap) return withOutline as ExpenseIonIcon;

  const aliased = API_ICON_ALIAS[key];
  if (aliased) return aliased;

  const compact = key.replace(/-/g, '');
  const aliasedCompact = API_ICON_ALIAS[compact];
  if (aliasedCompact) return aliasedCompact;

  return null;
}

/** Hyphenated slug → try full string, then each segment (`chai-shop` → `chai-shop`, `chai`, `shop`). */
export function expenseGlyphSlugLookupCandidates(slug: string): string[] {
  const s = slug.trim().toLowerCase();
  if (s === '') return [];
  const parts = s.split('-').filter((p) => p.length > 0);
  const out: string[] = [];
  if (!out.includes(s)) out.push(s);
  for (const p of parts) {
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

function appendUnique(out: string[], values: string[]): void {
  for (const v of values) {
    if (v !== '' && !out.includes(v)) out.push(v);
  }
}

/**
 * Expense feed / card: **`subcategory` slug segments first**, then explicit API **`glyphKey`**,
 * then **`primary`** slug segments — all mapped to Ionicons before bucket fallback.
 */
export function resolveExpenseIonFromFeedCategorySlugs(opts: {
  subcategorySlug: string | null | undefined;
  primarySlug: string | null | undefined;
  glyphKey: string | null | undefined;
  fallback: ExpenseIonIcon;
}): ExpenseIonIcon {
  const candidates: string[] = [];
  const sub = opts.subcategorySlug?.trim() ?? '';
  if (sub !== '') {
    appendUnique(candidates, expenseGlyphSlugLookupCandidates(sub));
  }
  const g = opts.glyphKey?.trim() ?? '';
  if (g !== '') {
    appendUnique(candidates, [g]);
  }
  const pri = opts.primarySlug?.trim() ?? '';
  if (pri !== '') {
    appendUnique(candidates, expenseGlyphSlugLookupCandidates(pri));
  }

  for (const raw of candidates) {
    const hit = lookupIonForGlyphKey(raw);
    if (hit !== null) return hit;
  }
  return opts.fallback;
}

export function isLikelyExpenseTierEmoji(icon: string): boolean {
  const t = icon.trim();
  if (t.length === 0 || t.length > 32) return false;
  if (/^[a-z][a-z0-9_\-.:]*$/i.test(t)) return false;

  try {
    return /\p{Extended_Pictographic}/u.test(t);
  } catch {
    return /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(t);
  }
}

export function isLikelyAsciiGlyphKey(s: string): boolean {
  return /^[a-z][a-z0-9_\-.:]*$/i.test(s.trim());
}

export function resolveExpenseIonFromGlyphKey(
  apiIcon: string | null | undefined,
  fallback: ExpenseIonIcon,
): ExpenseIonIcon {
  return lookupIonForGlyphKey(apiIcon) ?? fallback;
}
