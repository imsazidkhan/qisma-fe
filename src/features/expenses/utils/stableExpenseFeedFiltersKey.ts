import type { GroupExpenseFeedFilters } from '@/features/expenses/types/groupExpenseFeed.types';

export function stableExpenseFeedFiltersKey(filters: GroupExpenseFeedFilters): string {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(filters).sort() as (keyof GroupExpenseFeedFilters)[];
  for (const k of keys) {
    const v = filters[k];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out[String(k)] = [...v]
        .map((x) => String(x).trim())
        .filter(Boolean)
        .sort();
      continue;
    }
    if (v === '') continue;
    out[String(k)] = v;
  }
  return JSON.stringify(out);
}
