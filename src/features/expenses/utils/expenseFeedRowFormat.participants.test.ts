import { describe, expect, it } from 'vitest';

import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import {
  readExpenseFeedParticipantCount,
  readExpenseFeedParticipantFaces,
} from '@/features/expenses/utils/expenseFeedRowFormat';

function item(partial: Record<string, unknown>): GroupExpenseFeedItem {
  return partial as unknown as GroupExpenseFeedItem;
}

describe('feed participant wiring', () => {
  it('reads Veloraq ExpenseFeedItemDto splitParticipantPreview + splitParticipantCount', () => {
    const raw = item({
      id: 'e1',
      title: 't',
      amount: '100',
      currency: 'USD',
      date: '2026-01-01',
      splitParticipantCount: 5,
      splitParticipantPreview: [
        { id: 'u1', name: 'Alice', username: null, avatar: 'https://example.com/a.png' },
        { id: 'u2', name: null, username: 'bob', avatar: null },
      ],
    });
    expect(readExpenseFeedParticipantCount(raw)).toBe(5);
    const faces = readExpenseFeedParticipantFaces(raw);
    expect(faces).toHaveLength(2);
    expect(faces[0]?.id).toBe('u1');
    expect(faces[0]?.avatarUrl).toBe('https://example.com/a.png');
    expect(faces[1]?.name).toBe('bob');
  });

  it('counts root participant_user_ids (snake_case)', () => {
    const n = readExpenseFeedParticipantCount(
      item({
        id: 'e1',
        title: 't',
        amount: '100',
        currency: 'USD',
        date: '2026-01-01',
        participant_user_ids: ['a', 'b', 'c'],
      }),
    );
    expect(n).toBe(3);
  });

  it('coerces numeric participant_count strings', () => {
    const n = readExpenseFeedParticipantCount(
      item({
        id: 'e1',
        title: 't',
        amount: '100',
        currency: 'USD',
        date: '2026-01-01',
        participant_count: '5',
      }),
    );
    expect(n).toBe(5);
  });

  it('unions participant ids across split.lines', () => {
    const faces = readExpenseFeedParticipantFaces(
      item({
        id: 'e1',
        title: 't',
        amount: '100',
        currency: 'USD',
        date: '2026-01-01',
        split: {
          lines: [
            { participant_user_ids: ['u1'] },
            { participant_user_ids: ['u2'] },
            { participant_user_ids: ['u3'] },
          ],
        },
      }),
    );
    expect(faces.map((f) => f.id)).toEqual(['u1', 'u2', 'u3']);
  });
});
