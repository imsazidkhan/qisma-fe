import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import {
  isLikelyExpenseTierEmoji,
  resolveExpenseIonFromFeedCategorySlugs,
  type ExpenseIonIcon,
} from '@/features/expenses/utils/expenseCategoryIonResolve';
import type { ColorToken } from '@/theme/colors';
import {
  expenseFeedTagsFromItem,
  readCategoryPrimaryTierFromExpenseFeedItem,
  readCategorySecondaryTierFromExpenseFeedItem,
  readPrimaryCategoryTierFromExpenseFeedItem,
  type ExpenseCategoryTierWire,
} from '@/features/expenses/utils/readExpenseStructuredWire';

export type ExpenseFeedCategoryBucket =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'entertainment'
  | 'default';

const FALLBACK_PALETTE_KEYS: Record<
  ExpenseFeedCategoryBucket,
  { tintBg: ColorToken; iconFg: ColorToken; glyph: ExpenseIonIcon }
> = {
  food: {
    tintBg: 'expenseFeedCategoryTintFood',
    iconFg: 'expenseFeedCategoryIconFood',
    glyph: 'restaurant-outline',
  },
  travel: {
    tintBg: 'expenseFeedCategoryTintTravel',
    iconFg: 'expenseFeedCategoryIconTravel',
    glyph: 'airplane-outline',
  },
  shopping: {
    tintBg: 'expenseFeedCategoryTintShopping',
    iconFg: 'expenseFeedCategoryIconShopping',
    glyph: 'bag-handle-outline',
  },
  entertainment: {
    tintBg: 'expenseFeedCategoryTintEntertainment',
    iconFg: 'expenseFeedCategoryIconEntertainment',
    glyph: 'game-controller-outline',
  },
  default: {
    tintBg: 'expenseFeedCategoryTintDefault',
    iconFg: 'expenseFeedCategoryIconDefault',
    glyph: 'wallet-outline',
  },
};

function tierGlyphSemanticKey(t: ExpenseCategoryTierWire | null): string | null {
  if (!t) return null;
  if (t.iconKind === 'glyph' && (t.icon ?? '').trim() !== '') return (t.icon ?? '').trim();
  if (t.iconKind === 'emoji') return null;
  const fromIcon = (t.icon ?? '').trim();
  if (fromIcon !== '' && !isLikelyExpenseTierEmoji(fromIcon)) return fromIcon;
  const fromSlug = (t.slug ?? '').trim();
  return fromSlug !== '' ? fromSlug : null;
}

function inferBucketFromHaystack(raw: string): ExpenseFeedCategoryBucket {
  const s = raw.toLowerCase();
  if (
    /\b(pizza|dinner|lunch|breakfast|food|grocery|cafe|coffee|beer|wine|grocer)/.test(s) ||
    /\b(restaurant|cuisine|kitchen|tea|bubble)/.test(s)
  ) {
    return 'food';
  }
  if (
    /\b(uber|lyft|taxi|fuel|flight|metro|hotel|travel|visa|cab|gas|park|transport|rail)/.test(s)
  ) {
    return 'travel';
  }
  if (
    /\b(shopp|boutique|electronics|gadget|furniture|hardware|gift|beauty|cloth|fashion)/.test(s)
  ) {
    return 'shopping';
  }
  if (
    /\b(movie|concert|theatre|gaming|streaming|sport|ticket|music|club|bar|fun|party|celebr)/.test(
      s,
    )
  ) {
    return 'entertainment';
  }

  return 'default';
}

function classifyBucket(item: GroupExpenseFeedItem): ExpenseFeedCategoryBucket {
  const tags = expenseFeedTagsFromItem(item);
  const t0 = tags[0];
  if (t0) {
    return inferBucketFromHaystack(`${t0.slug} ${t0.label}`);
  }

  const tier = readPrimaryCategoryTierFromExpenseFeedItem(item);
  if (tier) {
    const iconPart =
      tier.iconKind === 'emoji' ? (tier.icon ?? '') : (tierGlyphSemanticKey(tier) ?? '');
    return inferBucketFromHaystack(`${tier.slug} ${tier.name} ${iconPart}`);
  }

  const r = item as Record<string, unknown>;
  const cat = typeof r.category === 'string' ? r.category.trim() : '';
  if (cat) return inferBucketFromHaystack(cat);
  return inferBucketFromHaystack(item.title);
}

type ExpenseFeedCategoryVisualShared = {
  bucket: ExpenseFeedCategoryBucket;
  tintToken: ColorToken;
  fgToken: ColorToken;
  colorOverride?: { fg: string; bg: string };
};

export type ResolvedExpenseFeedCategoryVisual =
  | (ExpenseFeedCategoryVisualShared & { kind: 'ion'; iconGlyph: ExpenseIonIcon })
  | (ExpenseFeedCategoryVisualShared & { kind: 'remote'; uri: string })
  | (ExpenseFeedCategoryVisualShared & { kind: 'emoji'; emoji: string });

function parseHexRgb(input: string): { r: number; g: number; b: number } | null {
  let hex = input.trim();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) return null;

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const n = Number.parseInt(hex, 16);
  if (!Number.isFinite(n)) return null;

  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

export function resolveExpenseFeedCategoryVisual(
  item: GroupExpenseFeedItem,
): ResolvedExpenseFeedCategoryVisual {
  const bucket = classifyBucket(item);
  const keys = FALLBACK_PALETTE_KEYS[bucket];

  const tags = expenseFeedTagsFromItem(item);
  const tag0 = tags[0];
  const categoryTier = readPrimaryCategoryTierFromExpenseFeedItem(item);
  const primaryTier = readCategoryPrimaryTierFromExpenseFeedItem(item);
  const secondaryTier = readCategorySecondaryTierFromExpenseFeedItem(item);

  let colorOverride: { fg: string; bg: string } | undefined;
  const colorSource =
    categoryTier?.color && typeof categoryTier.color === 'string'
      ? categoryTier.color
      : tag0?.color;
  if (colorSource && typeof colorSource === 'string') {
    const rgb = parseHexRgb(colorSource);
    if (rgb) {
      const { r, g, b } = rgb;
      colorOverride = {
        fg: `rgb(${String(r)},${String(g)},${String(b)})`,
        bg: `rgba(${String(r)},${String(g)},${String(b)},0.14)`,
      };
    }
  }

  const shared: ExpenseFeedCategoryVisualShared = {
    bucket,
    tintToken: keys.tintBg,
    fgToken: keys.iconFg,
    ...(colorOverride ? { colorOverride } : {}),
  };

  if (categoryTier?.remoteIconUrl && categoryTier.remoteIconUrl.trim() !== '') {
    return { ...shared, kind: 'remote', uri: categoryTier.remoteIconUrl.trim() };
  }

  const iconSemantic = categoryTier?.icon?.trim() ?? '';
  if (
    categoryTier &&
    iconSemantic !== '' &&
    (categoryTier.iconKind === 'emoji' || isLikelyExpenseTierEmoji(iconSemantic))
  ) {
    return { ...shared, kind: 'emoji', emoji: iconSemantic };
  }

  let iconGlyph = resolveExpenseIonFromFeedCategorySlugs({
    subcategorySlug: secondaryTier?.slug,
    glyphKey: tierGlyphSemanticKey(categoryTier),
    primarySlug: primaryTier?.slug,
    fallback: keys.glyph,
  });

  if (bucket === 'default') {
    const catStr =
      typeof (item as Record<string, unknown>).category === 'string'
        ? ((item as Record<string, unknown>).category as string)
        : '';
    const hinted = inferBucketFromHaystack(
      `${item.title} ${tag0?.slug ?? ''} ${tag0?.label ?? ''} ${categoryTier?.slug ?? ''} ${categoryTier?.name ?? ''} ${catStr}`,
    );
    if (hinted !== 'default') {
      iconGlyph = resolveExpenseIonFromFeedCategorySlugs({
        subcategorySlug: secondaryTier?.slug,
        glyphKey: tierGlyphSemanticKey(categoryTier),
        primarySlug: primaryTier?.slug,
        fallback: FALLBACK_PALETTE_KEYS[hinted].glyph,
      });
    }
  }

  return { ...shared, kind: 'ion', iconGlyph };
}
