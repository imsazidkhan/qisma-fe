import type { Ionicons } from '@expo/vector-icons';

import { formatMinorAsCurrency } from '@/features/groups/utils/formatMinorAsCurrency';

export function formatInsightsInr(minor: number): string {
  return formatMinorAsCurrency(minor, 'INR', 'en-IN');
}

export function categoryIconForInsights(slug: string): keyof typeof Ionicons.glyphMap {
  switch (slug) {
    case 'food':
      return 'restaurant-outline';
    case 'finance':
      return 'trending-up-outline';
    case 'travel':
      return 'car-outline';
    case 'shopping':
      return 'bag-handle-outline';
    case 'entertainment':
      return 'game-controller-outline';
    case 'bills':
      return 'receipt-outline';
    case 'uncategorized':
      return 'ellipse-outline';
    default:
      return 'pricetag-outline';
  }
}
