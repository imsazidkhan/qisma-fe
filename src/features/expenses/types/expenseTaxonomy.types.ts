import { z } from 'zod';

import { isLikelyAsciiGlyphKey } from '@/features/expenses/utils/expenseCategoryIonResolve';

function normalizeTierIconRaw(raw: unknown): { kind: 'emoji' | 'glyph'; value: string } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.kind === 'emoji' || o.kind === 'glyph') {
      const v = typeof o.value === 'string' ? o.value.trim() : '';
      if (v === '') return null;
      return { kind: o.kind, value: v };
    }
    return null;
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return null;
    if (/^https?:\/\//i.test(t)) return null;
    if (isLikelyAsciiGlyphKey(t)) return { kind: 'glyph', value: t };
    return { kind: 'emoji', value: t };
  }
  return null;
}

/** Category / subcategory tier from expense payloads, classify, and category tree. */
const expenseCategoryTierRawSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    color: z.union([z.string(), z.null()]).optional(),
    icon: z.unknown().optional(),
    iconUrl: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

function tierHttpsIconUrlFromRow(row: z.infer<typeof expenseCategoryTierRawSchema>): string | null {
  const direct = row.iconUrl;
  if (typeof direct === 'string') {
    const u = direct.trim();
    if (/^https?:\/\//i.test(u)) return u;
  }
  const ic = row.icon;
  if (typeof ic === 'string') {
    const u = ic.trim();
    if (/^https?:\/\//i.test(u)) return u;
  }
  return null;
}

function mapExpenseCategoryTierRow(row: z.infer<typeof expenseCategoryTierRawSchema>): {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  icon: { kind: 'emoji' | 'glyph'; value: string } | null;
  iconUrl: string | null;
} {
  const iconForKind =
    typeof row.icon === 'string' && /^https?:\/\//i.test(row.icon.trim())
      ? null
      : (row.icon ?? null);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color ?? null,
    icon: normalizeTierIconRaw(iconForKind),
    iconUrl: tierHttpsIconUrlFromRow(row),
  };
}

export const expenseCategoryTierSchema =
  expenseCategoryTierRawSchema.transform(mapExpenseCategoryTierRow);

export type ExpenseCategoryTier = z.infer<typeof expenseCategoryTierSchema>;

export const expenseTaxonomyCategoryTreeSchema = expenseCategoryTierRawSchema
  .extend({
    subcategories: z.array(expenseCategoryTierRawSchema).optional(),
  })
  .passthrough()
  .transform((row) => ({
    ...mapExpenseCategoryTierRow(row),
    subcategories: row.subcategories?.map(mapExpenseCategoryTierRow),
  }));

export type ExpenseTaxonomyCategoryTreeRow = z.infer<typeof expenseTaxonomyCategoryTreeSchema>;

export const expenseCategoryListSchema = z.array(expenseTaxonomyCategoryTreeSchema);

export type ExpenseCategoryListItem = ExpenseTaxonomyCategoryTreeRow;

export const expenseClassifyMerchantSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    normalizedName: z.string().optional(),
  })
  .passthrough();

export type ExpenseClassifyMerchant = z.infer<typeof expenseClassifyMerchantSchema>;

export const expenseTaxonomyTagSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    label: z.string(),
    color: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

export type ExpenseTaxonomyTag = z.infer<typeof expenseTaxonomyTagSchema>;

export const expenseClassificationMetaSchema = z.object({
  isFallback: z.boolean(),
  shouldPromptCorrection: z.boolean(),
  suggestedAlternatives: z.array(expenseCategoryTierSchema).nullable(),
});

export type ExpenseClassificationMeta = z.infer<typeof expenseClassificationMetaSchema>;

const expenseClassifyResponseCoreSchema = z.object({
  merchant: z.union([expenseClassifyMerchantSchema, z.null()]),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(expenseTaxonomyTagSchema).default([]),
  classification: expenseClassificationMetaSchema,
});

/** `data.category`: `{ primary, secondary }` or `null` — Veloraq classify. */
const expenseClassifyCategoryEnvelopeSchema = z.object({
  primary: expenseCategoryTierSchema,
  secondary: z
    .union([expenseCategoryTierSchema, z.null()])
    .optional()
    .transform((v) => v ?? null),
});

const expenseClassifyResponseNestedSchema = expenseClassifyResponseCoreSchema
  .extend({
    category: z.union([expenseClassifyCategoryEnvelopeSchema, z.null()]),
  })
  .transform((x) => ({
    category: x.category?.primary ?? null,
    subcategory: x.category?.secondary ?? null,
    merchant: x.merchant,
    confidence: x.confidence,
    tags: x.tags,
    classification: x.classification,
  }));

/** Flat category + subcategory tiers (legacy gateway shape). */
const expenseClassifyResponseFlatSchema = expenseClassifyResponseCoreSchema.extend({
  category: z.union([expenseCategoryTierSchema, z.null()]),
  subcategory: z.union([expenseCategoryTierSchema, z.null()]),
});

export const expenseClassifyResponseSchema = z.union([
  expenseClassifyResponseNestedSchema,
  expenseClassifyResponseFlatSchema,
]);

export type ExpenseClassifyResponse = z.infer<typeof expenseClassifyResponseSchema>;

export type ExpenseClassificationSource =
  | 'system'
  | 'user'
  | 'keyword'
  | 'merchant'
  | 'historical_bonus'
  | string;

export type ExpenseStructuredWire = {
  categoryId?: string | null;
  subcategoryId?: string | null;
  merchantId?: string | null;
  classificationConfidence?: string | null;
  classificationSource?: ExpenseClassificationSource | null;
  isUserClassified?: boolean;
  classifiedAt?: string | null;
  recurringDetected?: boolean;
  recurringConfidence?: string | null;
  recurringGroupId?: string | null;
  city?: string | null;
  metadata?: Record<string, unknown> | null;
  expenseMonth?: number | null;
  expenseYear?: number | null;
  expenseDayOfWeek?: number | null;
  expenseHour?: number | null;
  taxonomyTags?: ExpenseTaxonomyTag[];
};

/** Client hints from classify — only fields allowed on `POST …/expenses` (category from `title` server-side). */
export type ExpenseStructuredDraft = {
  merchantId?: string;
};

export function expenseStructuredDraftFromClassify(
  data: ExpenseClassifyResponse,
): ExpenseStructuredDraft {
  return {
    merchantId: data.merchant?.id,
  };
}
