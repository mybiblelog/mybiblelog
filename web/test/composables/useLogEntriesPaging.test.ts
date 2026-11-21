import { describe, it, expect } from 'vitest';
import { Bible } from '@mybiblelog/shared';
import { useLogEntriesPaging } from '~/composables/useLogEntriesPaging';
import type { LogEntriesQuery } from '~/helpers/log-entries-route-query';

type Entry = { id: number; date: string; startVerseId: number; endVerseId: number };

let nextId = 1;
const entry = (date: string, chapter = 1): Entry => ({
  id: nextId++,
  date,
  startVerseId: Bible.makeVerseId(1, chapter, 1),
  endVerseId: Bible.makeVerseId(1, chapter, 5),
});

function setup(entries: Entry[], q: Partial<LogEntriesQuery> = {}) {
  const query = ref<Partial<LogEntriesQuery>>(q);
  return { query, ...useLogEntriesPaging(query, ref(entries)) };
}

const dates = (groups: Array<{ date: string }>) => groups.map(g => g.date);

describe('useLogEntriesPaging', () => {
  it('sorts newest first by default and oldest first when ascending', () => {
    const entries = [entry('2026-01-02'), entry('2026-01-03'), entry('2026-01-01')];
    expect(dates(setup(entries).pagedEntryGroups.value)).toEqual(['2026-01-03', '2026-01-02', '2026-01-01']);
    expect(dates(setup(entries, { sortDirection: 'ascending' }).pagedEntryGroups.value))
      .toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });

  it('filters by date range and passage overlap', () => {
    const entries = [entry('2026-01-01', 1), entry('2026-01-02', 2), entry('2026-01-03', 1)];
    const { resultsSize, pagedEntries } = setup(entries, {
      startDate: '2026-01-02',
      filterPassageStartVerseId: Bible.makeVerseId(1, 1, 3),
      filterPassageEndVerseId: Bible.makeVerseId(1, 1, 3),
    });
    expect(resultsSize.value).toBe(1);
    expect(pagedEntries.value[0]!.date).toBe('2026-01-03');
  });

  it('never splits a day across pages', () => {
    const entries = [
      entry('2026-01-03'), entry('2026-01-03'), entry('2026-01-03'),
      entry('2026-01-02'),
      entry('2026-01-01'), entry('2026-01-01'),
    ];
    const { totalPages, pagedEntries, offsetForPage, query } = setup(entries, { limit: 2 });
    expect(totalPages.value).toBe(2);
    expect(pagedEntries.value).toHaveLength(3);
    expect([1, 2].map(offsetForPage)).toEqual([0, 3]);
    query.value = { limit: 2, offset: 3 };
    expect(pagedEntries.value.map(e => e.date)).toEqual(['2026-01-02', '2026-01-01', '2026-01-01']);
  });

  it('snaps an offset inside a page to that page start', () => {
    const entries = [entry('2026-01-03'), entry('2026-01-03'), entry('2026-01-02'), entry('2026-01-01')];
    const { page, effectiveOffset } = setup(entries, { limit: 1, offset: 1 });
    expect(page.value).toBe(1);
    expect(effectiveOffset.value).toBe(0);
  });

  it('clamps out-of-range page numbers and reports one page when empty', () => {
    const empty = setup([]);
    expect(empty.totalPages.value).toBe(1);
    expect(empty.pagedEntryGroups.value).toEqual([]);
    const { offsetForPage } = setup([entry('2026-01-02'), entry('2026-01-01')], { limit: 1 });
    expect(offsetForPage(0)).toBe(0);
    expect(offsetForPage(99)).toBe(1);
  });
});
