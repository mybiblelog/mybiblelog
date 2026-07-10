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
});

describe('encodePassageNotesQueryToRoute', () => {
  it('omits keys that equal the defaults', () => {
    expect(encodePassageNotesQueryToRoute({})).toEqual({});
    expect(encodePassageNotesQueryToRoute(defaultPassageNotesQuery())).toEqual({});
  });

  it('serializes non-default scalars and trims search text', () => {
    expect(encodePassageNotesQueryToRoute({ limit: 20, sortOn: 'updatedAt', searchText: '  grace  ' })).toEqual({
      limit: '20',
      sortOn: 'updatedAt',
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
