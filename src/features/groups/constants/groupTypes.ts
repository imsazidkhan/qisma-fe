import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IonGlyph = ComponentProps<typeof Ionicons>['name'];

/**
 * Wire labels via `i18n` (`createGroup.types.*`); type ids are stable keys.
 */
export const GROUP_TYPE_ORDER = ['trip', 'home', 'couple', 'office', 'other'] as const;

export type GroupTypeId = (typeof GROUP_TYPE_ORDER)[number];

export const GROUP_TYPE_EMOJI: Record<GroupTypeId, string> = {
  trip: '✈️',
  home: '🏠',
  couple: '💑',
  office: '💼',
  other: '✨',
};

/** Ionicons outline glyphs for create-group type rows (no emoji in this flow). */
export const GROUP_TYPE_GLYPH: Record<GroupTypeId, IonGlyph> = {
  trip: 'airplane-outline',
  home: 'home-outline',
  couple: 'heart-outline',
  office: 'briefcase-outline',
  other: 'apps-outline',
};
