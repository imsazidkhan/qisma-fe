import { describe, expect, it } from 'vitest';

import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';
import { seedSplitMapsForTabTransition } from '@/features/expenses/utils/splitTabTransitionSeed';

describe('seedSplitMapsForTabTransition', () => {
  it('clears exact / percent / shares when entering those tabs (including from equal)', () => {
    const ids = ['a', 'b'];
    const total = '100';
    const equalParts = computeEqualMajorPerPerson(total, 2);

    expect(
      seedSplitMapsForTabTransition('equal', 'exact', ids, total, equalParts, {}, {}, {}),
    ).toEqual({ exactByUserId: { a: '', b: '' } });

    expect(
      seedSplitMapsForTabTransition('equal', 'percentage', ids, total, equalParts, {}, {}, {}),
    ).toEqual({ percentByUserId: { a: '', b: '' } });

    expect(
      seedSplitMapsForTabTransition('equal', 'shares', ids, total, equalParts, {}, {}, {}),
    ).toEqual({ sharesByUserId: { a: 0, b: 0 } });
  });

  it('clears destination tab when switching between exact and percentage (no hydration)', () => {
    const ids = ['a', 'b'];
    const seed = seedSplitMapsForTabTransition(
      'exact',
      'percentage',
      ids,
      '100',
      computeEqualMajorPerPerson('100', 2),
      { a: '30', b: '70' },
      {},
      {},
    );
    expect(seed.percentByUserId).toEqual({ a: '', b: '' });
  });

  it('still seeds cleared percentage when leaving an incomplete exact split', () => {
    const ids = ['a', 'b'];
    const seed = seedSplitMapsForTabTransition(
      'exact',
      'percentage',
      ids,
      '100',
      null,
      { a: '60', b: '' },
      {},
      {},
    );
    expect(seed).toEqual({ percentByUserId: { a: '', b: '' } });
  });

  it('does not seed when switching to equal', () => {
    const ids = ['a', 'b'];
    const equalParts = computeEqualMajorPerPerson('100', 2);
    const seed = seedSplitMapsForTabTransition(
      'exact',
      'equal',
      ids,
      '100',
      equalParts,
      { a: '50', b: '50' },
      {},
      {},
    );
    expect(seed).toEqual({});
  });
});
