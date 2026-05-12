/**
 * Wire labels via `i18n` (`createGroup.types.*`); keep emoji stable in code
 * so layout and selection ids stay typed.
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
