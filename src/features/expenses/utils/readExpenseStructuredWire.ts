import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { ExpenseTaxonomyTag } from '@/features/expenses/types/expenseTaxonomy.types';
import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';

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

function parseTaxonomyTags(raw: unknown): ExpenseTaxonomyTag[] {
  if (!Array.isArray(raw)) return [];
  const out: ExpenseTaxonomyTag[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const slug = typeof o.slug === 'string' ? o.slug : '';
    const label = typeof o.label === 'string' ? o.label : '';
    const color = typeof o.color === 'string' ? o.color : '';
    if (!id || !label) continue;
    out.push({ id, slug, label, color });
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

export function primaryTaxonomyLabel(detail: ExpenseDetail): string | null {
  const wire = readExpenseStructuredWire(detail);
  if (wire.taxonomyTags.length > 0) {
    return wire.taxonomyTags.map((x) => x.label).join(' · ');
  }
  const d = detail as Record<string, unknown>;
  const cat = typeof d.category === 'string' ? d.category.trim() : '';
  if (cat) return cat;
  return null;
}

export function taxonomyLabelFromExpenseFeedItem(item: GroupExpenseFeedItem): string | null {
  const r = item as Record<string, unknown>;
  const tags = parseTaxonomyTags(r.taxonomyTags);
  if (tags.length > 0) {
    return tags.map((x) => x.label).join(' · ');
  }
  const cat = typeof r.category === 'string' ? r.category.trim() : '';
  if (cat) return cat;
  return null;
}
