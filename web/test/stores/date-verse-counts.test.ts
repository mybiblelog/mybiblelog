import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';

beforeEach(() => setActivePinia(createPinia()));

describe('date-verse-counts store', () => {
  it('getDateVerseCounts returns empty counts for an unknown date', () => {
    const store = useDateVerseCountsStore();
    expect(store.getDateVerseCounts('2026-01-01')).toEqual({ total: 0, unique: 0 });
  });

  it('getDateVerseCounts returns cached counts for a known date', () => {
    const store = useDateVerseCountsStore();
    store.dateVerseCounts = { '2026-01-01': { total: 10, unique: 8 } };
    expect(store.getDateVerseCounts('2026-01-01')).toEqual({ total: 10, unique: 8 });
  });

  it('busy reflects the in-flight job counter', () => {
    const store = useDateVerseCountsStore();
    expect(store.busy).toBe(false);
    store.jobs = 2;
    expect(store.busy).toBe(true);
  });

  it('cacheDateVerseCounts is a no-op with no log entries and settles jobs to 0', () => {
    const store = useDateVerseCountsStore();
    useLogEntriesStore().logEntries = [];
    useLogEntriesStore().isLoaded = true;
    store.cacheDateVerseCounts();
    expect(store.busy).toBe(false);
    expect(store.getAllDateVerseCounts).toEqual({});
  });

  // today.vue and progress.vue now read "new verses read today" from
  // getDateVerseCounts(date).unique instead of recomputing it inline. This locks
  // in that the stored `unique` equals the old inline formula
  // (countUnique(throughToday) - countUnique(throughYesterday)).
  it('unique for a date matches the incremental new-verses-read calculation', () => {
    useUserSettingsStore().settings.lookBackDate = '2026-01-01';
    // Day 1: Genesis 1:1-10 (10 verses). Day 2: Genesis 1:5-20 (overlaps 5-10,
    // so only 11-20 are new = 10 new verses).
    useLogEntriesStore().logEntries = [
      { id: 1, date: '2026-01-01', startVerseId: Bible.makeVerseId(1, 1, 1), endVerseId: Bible.makeVerseId(1, 1, 10) },
      { id: 2, date: '2026-01-02', startVerseId: Bible.makeVerseId(1, 1, 5), endVerseId: Bible.makeVerseId(1, 1, 20) },
    ] as never;
    useLogEntriesStore().isLoaded = true;

    const store = useDateVerseCountsStore();
    store.cacheDateVerseCounts();

    const day2 = store.getDateVerseCounts('2026-01-02');
    // total = unique verses logged that day (5..20 = 16); unique = new (11..20 = 10).
    expect(day2.total).toBe(16);
    expect(day2.unique).toBe(10);

    // Cross-check against the inline formula the pages used to run.
    const logEntries = useLogEntriesStore().currentLogEntries;
    const throughYesterday = logEntries.filter(e => e.date < '2026-01-02');
    const throughToday = logEntries.filter(e => e.date <= '2026-01-02');
    const inlineNewVerses = Bible.countUniqueRangeVerses(throughToday) - Bible.countUniqueRangeVerses(throughYesterday);
    expect(day2.unique).toBe(inlineNewVerses);
  });

  it('cacheDateVerseCounts replaces counts for dates the log no longer covers', () => {
    // Counts left over from another user (or deleted entries) on dates before
    // the current log's earliest entry must not survive a recompute.
    const store = useDateVerseCountsStore();
    store.dateVerseCounts = { '2020-01-01': { total: 31, unique: 31 } };
    useLogEntriesStore().logEntries = [
      { id: 1, date: '2026-01-01', startVerseId: Bible.makeVerseId(1, 1, 1), endVerseId: Bible.makeVerseId(1, 1, 10) },
    ] as never;
    useLogEntriesStore().isLoaded = true;

    store.cacheDateVerseCounts();

    expect(store.getDateVerseCounts('2020-01-01')).toEqual({ total: 0, unique: 0 });
    expect(store.getDateVerseCounts('2026-01-01').total).toBe(10);
  });

  it('cacheDateVerseCounts empties the map once the loaded log is empty', () => {
    const store = useDateVerseCountsStore();
    store.dateVerseCounts = { '2026-01-01': { total: 10, unique: 10 } };
    useLogEntriesStore().logEntries = [];
    useLogEntriesStore().isLoaded = true;

    store.cacheDateVerseCounts();

    expect(store.getAllDateVerseCounts).toEqual({});
  });

  it('cacheDateVerseCounts leaves counts alone until the log has loaded', () => {
    const store = useDateVerseCountsStore();
    store.dateVerseCounts = { '2026-01-01': { total: 10, unique: 10 } };

    store.cacheDateVerseCounts();

    expect(store.getDateVerseCounts('2026-01-01')).toEqual({ total: 10, unique: 10 });
  });

  it('clear drops all counts', () => {
    const store = useDateVerseCountsStore();
    store.dateVerseCounts = { '2026-01-01': { total: 10, unique: 10 } };
    store.clear();
    expect(store.getAllDateVerseCounts).toEqual({});
  });
});
