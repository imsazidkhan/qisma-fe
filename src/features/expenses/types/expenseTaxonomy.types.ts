import { z } from 'zod';

/** Relational category/subcategory row surfaced by classify or expense payloads. */
export const expenseTaxonomyNodeSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    icon: z.union([z.string(), z.null()]).optional(),
    color: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

export type ExpenseTaxonomyNode = z.infer<typeof expenseTaxonomyNodeSchema>;

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
  suggestedAlternatives: z.array(expenseTaxonomyNodeSchema).nullable(),
});

export type ExpenseClassificationMeta = z.infer<typeof expenseClassificationMetaSchema>;

export const expenseClassifyResponseSchema = z.object({
  category: z.union([expenseTaxonomyNodeSchema, z.null()]),
  subcategory: z.union([expenseTaxonomyNodeSchema, z.null()]),
  merchant: z.union([expenseClassifyMerchantSchema, z.null()]),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(expenseTaxonomyTagSchema).default([]),
  classification: expenseClassificationMetaSchema,
});

export type ExpenseClassifyResponse = z.infer<typeof expenseClassifyResponseSchema>;

export const expenseCategoryListSchema = z.array(expenseTaxonomyNodeSchema);
export type ExpenseCategoryListItem = z.infer<typeof expenseTaxonomyNodeSchema>;

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

export type ExpenseStructuredDraft = {
  categoryId?: string;
  subcategoryId?: string;
  merchantId?: string;
  tagIds: string[];
};

export function expenseStructuredDraftFromClassify(
  data: ExpenseClassifyResponse,
): ExpenseStructuredDraft {
  const tagIds = data.tags.map((x) => x.id).filter((id) => id.trim() !== '');
  return {
    categoryId: data.category?.id,
    subcategoryId: data.subcategory?.id,
    merchantId: data.merchant?.id,
    tagIds,
  };
}
