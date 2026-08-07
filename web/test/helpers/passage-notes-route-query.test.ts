import { describe, it, expect } from 'vitest';
import {
  decodePassageNotesRouteQuery,
  encodePassageNotesQueryToRoute,
  defaultPassageNotesQuery,
} from '~/helpers/passage-notes-route-query';

describe('decodePassageNotesRouteQuery', () => {
  it('returns defaults for an empty query', () => {
    expect(decodePassageNotesRouteQuery({})).toEqual({
      limit: 10,
      offset: 0,
      sortOn: 'createdAt',
      sortDirection: 'descending',
      filterTags: [],
      filterTagMatching: 'any',
      searchText: '',
      filterPassageStartVerseId: 0,
      filterPassageEndVerseId: 0,
      filterPassageMatching: 'inclusive',
    });
  });

  it('normalizes filterTags to a trimmed non-empty string array', () => {
    expect(decodePassageNotesRouteQuery({ filterTags: ['a', ' b ', ''] }).filterTags).toEqual(['a', 'b']);
    expect(decodePassageNotesRouteQuery({ filterTags: 'solo' }).filterTags).toEqual(['solo']);
    expect(decodePassageNotesRouteQuery({ filterTags: '' }).filterTags).toEqual([]);
  });

  it('validates enum fields', () => {
    expect(decodePassageNotesRouteQuery({ filterTagMatching: 'all' }).filterTagMatching).toBe('all');
    expect(decodePassageNotesRouteQuery({ filterTagMatching: 'nope' }).filterTagMatching).toBe('any');
    expect(decodePassageNotesRouteQuery({ filterPassageMatching: 'exclusive' }).filterPassageMatching).toBe('exclusive');
    expect(decodePassageNotesRouteQuery({ filterPassageMatching: 'nope' }).filterPassageMatching).toBe('inclusive');
  });

  it('requires both passage verse ids or zeroes both', () => {
    expect(decodePassageNotesRouteQuery({ filterPassageEndVerseId: '101001031' })).toMatchObject({
      filterPassageStartVerseId: 0,
      filterPassageEndVerseId: 0,
    });
  });

  it('defaults to passage order when a passage filter is present', () => {
    expect(decodePassageNotesRouteQuery({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    })).toMatchObject({ sortOn: 'passage', sortDirection: 'ascending' });
  });

  it('keeps an explicit sort alongside a passage filter', () => {
    expect(decodePassageNotesRouteQuery({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
      sortOn: 'createdAt',
      sortDirection: 'descending',
    })).toMatchObject({ sortOn: 'createdAt', sortDirection: 'descending' });
  });

  it('falls back to the contextual default for an unknown sortOn', () => {
    expect(decodePassageNotesRouteQuery({ sortOn: 'updatedAt' }).sortOn).toBe('createdAt');
    expect(decodePassageNotesRouteQuery({
      sortOn: 'updatedAt',
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    }).sortOn).toBe('passage');
  });

  it('ignores a half-specified passage filter when defaulting the sort', () => {
    expect(decodePassageNotesRouteQuery({ filterPassageStartVerseId: '101001001' })).toMatchObject({
      sortOn: 'createdAt',
      sortDirection: 'descending',
    });
  });
});

describe('encodePassageNotesQueryToRoute', () => {
  it('omits keys that equal the defaults', () => {
    expect(encodePassageNotesQueryToRoute({})).toEqual({});
    expect(encodePassageNotesQueryToRoute(defaultPassageNotesQuery())).toEqual({});
  });

  it('serializes non-default scalars and trims search text', () => {
    expect(encodePassageNotesQueryToRoute({ limit: 20, sortDirection: 'ascending', searchText: '  grace  ' })).toEqual({
      limit: '20',
      sortDirection: 'ascending',
      searchText: 'grace',
    });
  });

  it('omits blank search text', () => {
    expect(encodePassageNotesQueryToRoute({ searchText: '   ' })).toEqual({});
  });

  it('serializes filter tags as an array', () => {
    expect(encodePassageNotesQueryToRoute({ filterTags: ['1', '2'] })).toEqual({ filterTags: ['1', '2'] });
  });

  it('emits filterTagMatching when non-default, or when exact with no tags', () => {
    expect(encodePassageNotesQueryToRoute({ filterTagMatching: 'all' })).toMatchObject({ filterTagMatching: 'all' });
    expect(encodePassageNotesQueryToRoute({ filterTagMatching: 'exact', filterTags: [] })).toMatchObject({ filterTagMatching: 'exact' });
  });

  it('emits the passage filter only when both ids are present, with matching', () => {
    expect(encodePassageNotesQueryToRoute({ filterPassageStartVerseId: 101001001 })).toEqual({});
    expect(encodePassageNotesQueryToRoute({
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
      filterPassageMatching: 'exclusive',
    })).toEqual({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
      filterPassageMatching: 'exclusive',
    });
  });

  it('omits passage order when a passage filter makes it the default', () => {
    expect(encodePassageNotesQueryToRoute({
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
      sortOn: 'passage',
      sortDirection: 'ascending',
    })).toEqual({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    });
  });

  it('emits a createdAt sort chosen alongside a passage filter', () => {
    expect(encodePassageNotesQueryToRoute({
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
      sortOn: 'createdAt',
      sortDirection: 'descending',
    })).toEqual({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
      sortOn: 'createdAt',
      sortDirection: 'descending',
    });
  });

  it('emits passage order when no passage filter makes it non-default', () => {
    expect(encodePassageNotesQueryToRoute({ sortOn: 'passage', sortDirection: 'ascending' })).toEqual({
      sortOn: 'passage',
      sortDirection: 'ascending',
    });
  });
});

describe('passage notes sort round-trips', () => {
  it.each([
    ['passage filter, default sort', { filterPassageStartVerseId: 101001001, filterPassageEndVerseId: 101001031, sortOn: 'passage' as const, sortDirection: 'ascending' as const }],
    ['passage filter, createdAt sort', { filterPassageStartVerseId: 101001001, filterPassageEndVerseId: 101001031, sortOn: 'createdAt' as const, sortDirection: 'descending' as const }],
    ['no filter, default sort', { sortOn: 'createdAt' as const, sortDirection: 'descending' as const }],
    ['no filter, passage sort', { sortOn: 'passage' as const, sortDirection: 'ascending' as const }],
  ])('preserves the sort through encode/decode: %s', (_label, query) => {
    const decoded = decodePassageNotesRouteQuery(encodePassageNotesQueryToRoute(query));
    expect(decoded).toMatchObject({ sortOn: query.sortOn, sortDirection: query.sortDirection });
  });
});

describe('defaultPassageNotesQuery', () => {
  it('returns a fresh copy each call', () => {
    const a = defaultPassageNotesQuery();
    const b = defaultPassageNotesQuery();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.filterTags).not.toBe(b.filterTags);
  });
});
