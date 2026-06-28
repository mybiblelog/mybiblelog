import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';
import { useLogEntriesStore } from '~/stores/log-entries';

beforeEach(() => setActivePinia(createPinia()));

describe('reading-suggestions store', () => {
  it('suggests the start of each reading path when nothing has been read', () => {
    useLogEntriesStore().logEntries = [];
    const store = useReadingSuggestionsStore();

    store.refreshReadingSuggestions();

    expect(store.passages).toHaveLength(3);
    // New Testament path is offered first → Matthew chapter 1.
    expect(store.passages[0].startVerseId).toBe(Bible.makeVerseId(40, 1, 1));
    for (const passage of store.passages) {
      expect(passage.suggestionContext).toBeTruthy();
    }
  });

  it('does not re-suggest a chapter that has already been read', () => {
    const matthew1Start = Bible.makeVerseId(40, 1, 1);
    const matthew1End = Bible.getLastBookChapterVerseId(40, 1);
    useLogEntriesStore().logEntries = [
      { id: 1, date: '2026-01-01', startVerseId: matthew1Start, endVerseId: matthew1End } as never,
    ];
    const store = useReadingSuggestionsStore();

    store.refreshReadingSuggestions();

    const startIds = store.passages.map(p => p.startVerseId);
    expect(startIds).not.toContain(matthew1Start);
  });
});
