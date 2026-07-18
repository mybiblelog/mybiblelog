import { describe, it, expect } from 'vitest';
import { buildResultsSummary } from '~/helpers/results-summary';

describe('buildResultsSummary', () => {
  it('returns none when there are no results', () => {
    expect(buildResultsSummary({ total: 0, offset: 0, limit: 10, pageLength: 0 })).toEqual({ kind: 'none', total: 0 });
  });

  it('returns all when the result set fits on one page', () => {
    expect(buildResultsSummary({ total: 7, offset: 0, limit: 10, pageLength: 7 })).toEqual({ kind: 'all', total: 7 });
  });

  it('treats total equal to limit as a single page', () => {
    expect(buildResultsSummary({ total: 10, offset: 0, limit: 10, pageLength: 10 })).toEqual({ kind: 'all', total: 10 });
  });

  it('returns a 1-based range for a windowed page', () => {
    expect(buildResultsSummary({ total: 55, offset: 20, limit: 10, pageLength: 10 }))
      .toEqual({ kind: 'range', first: 21, last: 30, total: 55 });
  });

  it('clamps last to total on a short final page', () => {
    expect(buildResultsSummary({ total: 23, offset: 20, limit: 10, pageLength: 3 }))
      .toEqual({ kind: 'range', first: 21, last: 23, total: 23 });
  });

  it('coerces and floors bad numeric inputs', () => {
    expect(buildResultsSummary({ total: Number.NaN, offset: -5, limit: 0, pageLength: -1 }))
      .toEqual({ kind: 'none', total: 0 });
  });
});
