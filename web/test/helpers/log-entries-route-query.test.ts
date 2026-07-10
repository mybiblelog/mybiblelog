import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  decodeLogEntriesRouteQuery,
  encodeLogEntriesQueryToRoute,
  defaultLogEntriesQuery,
} from '~/helpers/log-entries-route-query';

// The helper uses dayjs strict parsing (`dayjs(v, 'YYYY-MM-DD', true)`), which
// only enforces the format when the customParseFormat plugin is registered. The
// app extends it elsewhere; register it here so the test exercises the intended
// strict-format behavior.
dayjs.extend(customParseFormat);

describe('decodeLogEntriesRouteQuery', () => {
  it('returns defaults for an empty query', () => {
    expect(decodeLogEntriesRouteQuery({})).toEqual({
      limit: 10,
      offset: 0,
      sortDirection: 'descending',
      startDate: '',
      endDate: '',
      filterPassageStartVerseId: 0,
      filterPassageEndVerseId: 0,
    });
  });

  it('clamps limit into 1..50 and floors offset at 0', () => {
    expect(decodeLogEntriesRouteQuery({ limit: '999', offset: '-5' })).toMatchObject({ limit: 50, offset: 0 });
    expect(decodeLogEntriesRouteQuery({ limit: '0' })).toMatchObject({ limit: 1 });
  });

  it('falls back to defaults for non-numeric / invalid values', () => {
    expect(decodeLogEntriesRouteQuery({ limit: 'abc', offset: 'xyz' })).toMatchObject({ limit: 10, offset: 0 });
  });

  it('only accepts a valid sortDirection enum', () => {
    expect(decodeLogEntriesRouteQuery({ sortDirection: 'ascending' }).sortDirection).toBe('ascending');
    expect(decodeLogEntriesRouteQuery({ sortDirection: 'sideways' }).sortDirection).toBe('descending');
  });

  it('keeps valid YYYY-MM-DD dates and drops invalid ones', () => {
    expect(decodeLogEntriesRouteQuery({ startDate: '2026-06-28' }).startDate).toBe('2026-06-28');
    expect(decodeLogEntriesRouteQuery({ startDate: 'not-a-date' }).startDate).toBe('');
    expect(decodeLogEntriesRouteQuery({ endDate: '06/28/2026' }).endDate).toBe('');
  });

  it('requires both passage verse ids or zeroes both', () => {
    expect(decodeLogEntriesRouteQuery({ filterPassageStartVerseId: '101001001' })).toMatchObject({
      filterPassageStartVerseId: 0,
      filterPassageEndVerseId: 0,
    });
    expect(decodeLogEntriesRouteQuery({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    })).toMatchObject({
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
    });
  });
});

describe('encodeLogEntriesQueryToRoute', () => {
  it('omits keys that equal the defaults', () => {
    expect(encodeLogEntriesQueryToRoute({})).toEqual({});
    expect(encodeLogEntriesQueryToRoute(defaultLogEntriesQuery())).toEqual({});
  });

  it('serializes non-default scalar values as strings', () => {
    expect(encodeLogEntriesQueryToRoute({ limit: 25, offset: 10, sortDirection: 'ascending' })).toEqual({
      limit: '25',
      offset: '10',
      sortDirection: 'ascending',
    });
  });

  it('includes valid dates and skips invalid ones', () => {
    expect(encodeLogEntriesQueryToRoute({ startDate: '2026-01-01', endDate: 'bad' })).toEqual({
      startDate: '2026-01-01',
    });
  });

  it('emits the passage filter only when both ids are present', () => {
    expect(encodeLogEntriesQueryToRoute({ filterPassageStartVerseId: 101001001 })).toEqual({});
    expect(encodeLogEntriesQueryToRoute({
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
    })).toEqual({
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    });
  });
});

describe('decode/encode round trip', () => {
  it('is stable for a fully-specified non-default query', () => {
    const route = {
      limit: '20',
      offset: '40',
      sortDirection: 'ascending',
      startDate: '2026-02-02',
      endDate: '2026-03-03',
      filterPassageStartVerseId: '101001001',
      filterPassageEndVerseId: '101001031',
    };
    expect(encodeLogEntriesQueryToRoute(decodeLogEntriesRouteQuery(route))).toEqual(route);
  });
});

describe('defaultLogEntriesQuery', () => {
  it('returns a fresh copy each call', () => {
    const a = defaultLogEntriesQuery();
    const b = defaultLogEntriesQuery();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
