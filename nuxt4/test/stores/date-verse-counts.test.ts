import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useLogEntriesStore } from '~/stores/log-entries';

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
    store.cacheDateVerseCounts();
    expect(store.busy).toBe(false);
    expect(store.getAllDateVerseCounts).toEqual({});
  });
});
