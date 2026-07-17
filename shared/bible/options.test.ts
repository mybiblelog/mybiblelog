import { describe, expect, it } from 'vitest';
import Bible from './index';
import { filterAndSortBookOptions, getBookOptions, suggestBooks } from './options';

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

describe('suggestBooks', () => {
  it('prefix-matches English book names', () => {
    const suggestions = suggestBooks('gen', { locale: 'en' });
    expect(suggestions[0]).toEqual({ book: 1, label: 'Genesis' });
  });

  it('matches books with leading ordinals, with or without a space', () => {
    const spaced = suggestBooks('1 j', { locale: 'en' });
    expect(spaced.map(s => s.label)).toContain('1 John');
    const unspaced = suggestBooks('1joh', { locale: 'en' });
    expect(unspaced.map(s => s.label)).toEqual(['1 John']);
    const corinthians = suggestBooks('2 co', { locale: 'en' });
    expect(corinthians.map(s => s.label)).toContain('2 Corinthians');
  });

  it('matches abbreviations, ranking name matches first', () => {
    const suggestions = suggestBooks('gn', { locale: 'en' });
    expect(suggestions.map(s => s.label)).toContain('Genesis');
  });

  it('is case- and diacritic-insensitive for localized names', () => {
    const suggestions = suggestBooks('genesis', { locale: 'es' });
    expect(suggestions.map(s => s.label)).toContain('Génesis');
  });

  it('suggests locale-specific book names', () => {
    expect(suggestBooks('joh', { locale: 'de' }).map(s => s.label)).toContain('Johannes');
    expect(suggestBooks('joh', { locale: 'en' }).map(s => s.label)).toContain('John');
    expect(suggestBooks('창', { locale: 'ko' }).map(s => s.label)).toContain('창세기');
  });

  it('caps results at the limit', () => {
    expect(suggestBooks('j', { locale: 'en', limit: 3 })).toHaveLength(3);
    const defaultLimit = suggestBooks('1', { locale: 'en' });
    expect(defaultLimit.length).toBeLessThanOrEqual(8);
  });

  it('returns nothing for empty or unmatched queries', () => {
    expect(suggestBooks('', { locale: 'en' })).toEqual([]);
    expect(suggestBooks('   ', { locale: 'en' })).toEqual([]);
    expect(suggestBooks('xyz', { locale: 'en' })).toEqual([]);
    expect(suggestBooks('Genesis 1', { locale: 'en' })).toEqual([]);
  });
});
