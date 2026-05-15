import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { ExpenseTaxonomyTag } from '@/features/expenses/types/expenseTaxonomy.types';
import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import { isLikelyAsciiGlyphKey } from '@/features/expenses/utils/expenseCategoryIonResolve';

export type ExpenseStructuredWireSnapshot = {
  categoryId: string | null;
  subcategoryId: string | null;
  merchantId: string | null;
  tagIds: string[];
  taxonomyTags: ExpenseTaxonomyTag[];
};

function pickNullableString(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v === 'string' && v.trim() !== '') return v;
  return null;
}

/**
 * Normalized tier for feed/detail visuals. Mirrors API **`category.primary` / `secondary`**
 * with optional structured **`icon: { kind, value }`** and **`iconUrl`**.
 */
export type ExpenseCategoryTierWire = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  iconKind: 'emoji' | 'glyph' | null;
  color: string | null;
  remoteIconUrl: string | null;
};

function parseHttpIconUrlCandidate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function normalizeWireIconFields(o: Record<string, unknown>): {
  icon: string | null;
  iconKind: 'emoji' | 'glyph' | null;
  remoteIconUrl: string | null;
} {
  const explicitRemote =
    parseHttpIconUrlCandidate(o.iconUrl) ??
    parseHttpIconUrlCandidate(o.icon_url) ??
    parseHttpIconUrlCandidate(o.imageUrl) ??
    parseHttpIconUrlCandidate(o.iconImageUrl);

  const rawIcon = o.icon;
  if (
    rawIcon !== null &&
    rawIcon !== undefined &&
    typeof rawIcon === 'object' &&
    !Array.isArray(rawIcon)
  ) {
    const io = rawIcon as Record<string, unknown>;
    if (io.kind === 'emoji' || io.kind === 'glyph') {
      const v = typeof io.value === 'string' ? io.value.trim() : '';
      if (v !== '') {
        return {
          icon: v,
          iconKind: io.kind,
          remoteIconUrl: explicitRemote ?? null,
        };
      }
    }
  }

  const iconField = typeof rawIcon === 'string' ? rawIcon.trim() : '';
  const remoteFromIconField = iconField !== '' ? parseHttpIconUrlCandidate(iconField) : null;
  const remoteIconUrl = explicitRemote ?? remoteFromIconField ?? null;
  if (iconField !== '' && remoteFromIconField === null) {
    if (isLikelyAsciiGlyphKey(iconField)) {
      return { icon: iconField, iconKind: 'glyph', remoteIconUrl };
    }
    return { icon: iconField, iconKind: 'emoji', remoteIconUrl };
  }
  return { icon: null, iconKind: null, remoteIconUrl };
}

function parseExpenseCategoryTierWire(raw: unknown): ExpenseCategoryTierWire | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id.trim() : '';
  const slug = typeof o.slug === 'string' ? o.slug.trim() : '';
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!id || (!slug && !name)) return null;

  const colorRaw = typeof o.color === 'string' && o.color.trim() !== '' ? o.color.trim() : null;
  const { icon, iconKind, remoteIconUrl } = normalizeWireIconFields(o);

  return {
    id,
    slug,
    name: name || slug,
    icon,
    iconKind,
    color: colorRaw,
    remoteIconUrl,
  };
}

function readCategoryEnvelopeRaw(
  r: Record<string, unknown>,
): { primary: unknown; secondary: unknown } | null {
  const c = r.category;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const o = c as Record<string, unknown>;
  if (!('primary' in o)) return null;
  return { primary: o.primary, secondary: o.secondary };
}

function mergeCategoryChildIntoParent(
  secondary: ExpenseCategoryTierWire | null,
  primary: ExpenseCategoryTierWire | null,
): ExpenseCategoryTierWire | null {
  if (secondary !== null && primary !== null) {
    return {
      ...secondary,
      color: secondary.color ?? primary.color,
    };
  }
  return secondary ?? primary;
}

export function readCategoryPrimaryTierFromExpenseFeedItem(
  item: GroupExpenseFeedItem,
): ExpenseCategoryTierWire | null {
  const r = item as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(r);
  if (env === null) return null;
  return parseExpenseCategoryTierWire(env.primary);
}

export function readCategorySecondaryTierFromExpenseFeedItem(
  item: GroupExpenseFeedItem,
): ExpenseCategoryTierWire | null {
  const r = item as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(r);
  if (env === null) return null;
  if (env.secondary === null || env.secondary === undefined) return null;
  return parseExpenseCategoryTierWire(env.secondary);
}

export function readPrimaryCategoryTierFromExpenseFeedItem(
  item: GroupExpenseFeedItem,
): ExpenseCategoryTierWire | null {
  const r = item as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(r);
  if (env !== null) {
    const primary = parseExpenseCategoryTierWire(env.primary);
    const secondary =
      env.secondary === null || env.secondary === undefined
        ? null
        : parseExpenseCategoryTierWire(env.secondary);
    return mergeCategoryChildIntoParent(secondary, primary);
  }
  return null;
}

export function parseTaxonomyTags(raw: unknown): ExpenseTaxonomyTag[] {
  if (!Array.isArray(raw)) return [];
  const out: ExpenseTaxonomyTag[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const slug = typeof o.slug === 'string' ? o.slug : '';
    const label = typeof o.label === 'string' ? o.label : '';
    const colorRaw = typeof o.color === 'string' && o.color.trim() !== '' ? o.color.trim() : null;
    if (!id || !label) continue;
    const tag = {
      id,
      slug,
      label,
      ...(colorRaw ? { color: colorRaw } : {}),
    };
    out.push(tag);
  }
  return out;
}

export function readExpenseStructuredWire(detail: ExpenseDetail): ExpenseStructuredWireSnapshot {
  const d = detail as Record<string, unknown>;
  const taxonomyTags = parseTaxonomyTags(d.taxonomyTags);
  const tagIds = taxonomyTags.map((x) => x.id);
  return {
    categoryId: pickNullableString(d.categoryId),
    subcategoryId: pickNullableString(d.subcategoryId),
    merchantId: pickNullableString(d.merchantId),
    tagIds,
    taxonomyTags,
  };
}

export function expenseStructuredWireEqual(
  a: ExpenseStructuredWireSnapshot,
  b: ExpenseStructuredWireSnapshot,
): boolean {
  if (a.categoryId !== b.categoryId) return false;
  if (a.subcategoryId !== b.subcategoryId) return false;
  if (a.merchantId !== b.merchantId) return false;
  if (a.tagIds.length !== b.tagIds.length) return false;
  const sa = [...a.tagIds].sort().join('\0');
  const sb = [...b.tagIds].sort().join('\0');
  return sa === sb;
}

export function primaryCategoryLabelFromExpenseDetail(detail: ExpenseDetail): string | null {
  const wire = readExpenseStructuredWire(detail);
  if (wire.taxonomyTags.length > 0) {
    return wire.taxonomyTags.map((x) => x.label).join(' · ');
  }
  const d = detail as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(d);
  if (env !== null) {
    const primary = parseExpenseCategoryTierWire(env.primary);
    const secondary =
      env.secondary === null || env.secondary === undefined
        ? null
        : parseExpenseCategoryTierWire(env.secondary);
    const pName = (primary?.name ?? '').trim();
    const sName = (secondary?.name ?? '').trim();
    if (pName && sName) return `${pName} · ${sName}`;
    if (sName) return sName;
    if (pName) return pName;
  }
  const cat = typeof d.category === 'string' ? d.category.trim() : '';
  if (cat) return cat;
  return null;
}

export function expenseFeedTagsFromItem(item: GroupExpenseFeedItem): ExpenseTaxonomyTag[] {
  const r = item as Record<string, unknown>;
  return parseTaxonomyTags(r.taxonomyTags);
}

/**
 * Category text for feed card meta: **`category.primary.name`** when the API sends the envelope
 * (subcategory icon is handled separately in the bubble). Tags / merged tier / legacy string otherwise.
 */
export function expenseFeedCardMetaCategoryLabel(item: GroupExpenseFeedItem): string | null {
  const r = item as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(r);
  if (env !== null) {
    const primary = parseExpenseCategoryTierWire(env.primary);
    const pName = (primary?.name ?? '').trim();
    if (pName) return pName;
  }
  return categoryPrimaryLabelFromExpenseFeedItem(item);
}

export function categoryPrimaryLabelFromExpenseFeedItem(item: GroupExpenseFeedItem): string | null {
  const tags = expenseFeedTagsFromItem(item);
  const first = tags[0]?.label.trim();
  if (first) return first;
  const tier = readPrimaryCategoryTierFromExpenseFeedItem(item);
  const tierName = (tier?.name ?? '').trim();
  if (tierName) return tierName;
  const r = item as Record<string, unknown>;
  const cat = typeof r.category === 'string' ? r.category.trim() : '';
  return cat !== '' ? cat : null;
}

export function categoryLabelFromExpenseFeedItem(item: GroupExpenseFeedItem): string | null {
  const tags = expenseFeedTagsFromItem(item);
  if (tags.length > 0) {
    return tags.map((x) => x.label).join(' · ');
  }
  const r = item as Record<string, unknown>;
  const env = readCategoryEnvelopeRaw(r);
  if (env !== null) {
    const primary = parseExpenseCategoryTierWire(env.primary);
    const secondary =
      env.secondary === null || env.secondary === undefined
        ? null
        : parseExpenseCategoryTierWire(env.secondary);
    const pName = (primary?.name ?? '').trim();
    const sName = (secondary?.name ?? '').trim();
    if (pName && sName) return `${pName} · ${sName}`;
    if (sName) return sName;
    if (pName) return pName;
  }
  const tier = readPrimaryCategoryTierFromExpenseFeedItem(item);
  const tierName = (tier?.name ?? '').trim();
  if (tierName) return tierName;
  const cat = typeof r.category === 'string' ? r.category.trim() : '';
  if (cat) return cat;
  return null;
}
