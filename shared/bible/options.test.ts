import { describe, expect, it } from 'vitest';
import Bible from './index';
import { filterAndSortBookOptions, getBookOptions } from './options';

describe('getBookOptions', () => {
  it('returns one localized option per book in canonical order', () => {
    const options = getBookOptions('en');
    expect(options).toHaveLength(Bible.getBookCount());
    expect(options[0]).toEqual({ label: Bible.getBookName(1, 'en'), value: 1 });
    expect(options.map(o => o.value)).toEqual([...options].map(o => o.value).sort((a, b) => a - b));
  });
});

describe('filterAndSortBookOptions', () => {
  const options = getBookOptions('en');

  it('filters to a single testament', () => {
    const old = filterAndSortBookOptions(options, { testament: 'old' });
    const neu = filterAndSortBookOptions(options, { testament: 'new' });
    expect(old.length + neu.length).toBe(options.length);
    // Genesis (1) is old, Matthew (40) is new.
    expect(old.some(o => o.value === 1)).toBe(true);
    expect(old.some(o => o.value === 40)).toBe(false);
    expect(neu.some(o => o.value === 40)).toBe(true);
  });

  it('sorts numerically by bible order by default', () => {
    const result = filterAndSortBookOptions(options, { testament: 'old', sortOrder: 'numerical' });
    const values = result.map(o => o.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('sorts alphabetically ignoring leading ordinals', () => {
    const result = filterAndSortBookOptions(options, { testament: 'old', sortOrder: 'alphabetical' });
    const labels = result.map(o => o.label);
    const expected = [...labels].sort((a, b) =>
      a.replace(/^\d+\s*/, '').localeCompare(b.replace(/^\d+\s*/, ''), 'en'),
    );
    expect(labels).toEqual(expected);
  });

  it('does not mutate the input array', () => {
    const snapshot = options.map(o => ({ ...o }));
    filterAndSortBookOptions(options, { testament: 'new', sortOrder: 'alphabetical' });
    expect(options).toEqual(snapshot);
  });
});
