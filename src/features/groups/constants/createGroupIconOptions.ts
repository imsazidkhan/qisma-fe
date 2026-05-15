import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IonGlyph = ComponentProps<typeof Ionicons>['name'];

/**
 * Decorative glyph options for the create-group icon strip (wire icon is optional / unused).
 */
export const CREATE_GROUP_ICON_KEYS = ['crew', 'trip', 'event', 'money', 'food', 'more'] as const;

export type CreateGroupIconKey = (typeof CREATE_GROUP_ICON_KEYS)[number];

export const CREATE_GROUP_ICON_GLYPH: Record<CreateGroupIconKey, IonGlyph> = {
  crew: 'people-outline',
  trip: 'airplane-outline',
  event: 'calendar-outline',
  money: 'wallet-outline',
  food: 'restaurant-outline',
  more: 'ellipse-outline',
};
