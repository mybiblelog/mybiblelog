import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import {
  getRecentDates,
  getLastLogEntryPerBook,
  filterSuggestionsOverlappingPassages,
  filterRangesByPassage,
  cropRangesByPassage,
  passageIsRead,
  getBookChapterRanges,
  getReadingPathSuggestions,
  type ReadingSuggestionPassage,
} from '~/helpers/reading-suggestions';

// Genesis ch1 v1 → 101001001, Exodus ch1 v1 → 102001001
const gen1v1 = Bible.makeVerseId(1, 1, 1);
const gen1v31 = Bible.makeVerseId(1, 1, 31);
const gen2v1 = Bible.makeVerseId(1, 2, 1);
const gen50v26 = Bible.makeVerseId(1, 50, 26);
const exo1v1 = Bible.makeVerseId(2, 1, 1);
const exo1v22 = Bible.makeVerseId(2, 1, 22);

describe('getRecentDates', () => {
  it('returns the correct number of dates', () => {
    expect(getRecentDates(3)).toHaveLength(3);
  });

  it('handles daysBack = 0', () => {
    expect(getRecentDates(0)).toEqual([]);
  });

  it('excludes today', () => {
    const today = dayjs().format('YYYY-MM-DD');
    expect(getRecentDates(5)).not.toContain(today);
  });

  it('returns dates in descending order (yesterday first)', () => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const dates = getRecentDates(3);
    expect(dates[0]).toBe(yesterday);
  });

  it('returns consecutive days', () => {
    const dates = getRecentDates(4);
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = dayjs(dates[i]).diff(dayjs(dates[i + 1]), 'day');
      expect(diff).toBe(1);
    }
  });
});

describe('getLastLogEntryPerBook', () => {
  it('returns empty object for no entries', () => {
    expect(getLastLogEntryPerBook([])).toEqual({});
  });

  it('keeps the entry with the highest endVerseId per book', () => {
    const early = { startVerseId: gen1v1, endVerseId: gen1v1, date: '2026-06-10' };
    const late = { startVerseId: gen1v1, endVerseId: gen1v31, date: '2026-06-11' };
    const result = getLastLogEntryPerBook([early, late]);
    expect(result[1]).toBe(late);
  });

  it('keeps the earlier entry if it has a higher endVerseId', () => {
    const further = { startVerseId: gen1v1, endVerseId: gen1v31, date: '2026-06-10' };
    const shorter = { startVerseId: gen1v1, endVerseId: gen1v1, date: '2026-06-11' };
    const result = getLastLogEntryPerBook([further, shorter]);
    expect(result[1]).toBe(further);
  });

  it('tracks entries across multiple books', () => {
    const genesisEntry = { startVerseId: gen1v1, endVerseId: gen1v31, date: '2026-06-10' };
    const exodusEntry = { startVerseId: exo1v1, endVerseId: exo1v22, date: '2026-06-11' };
    const result = getLastLogEntryPerBook([genesisEntry, exodusEntry]);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result[1]).toBe(genesisEntry);
    expect(result[2]).toBe(exodusEntry);
  });
});

describe('filterSuggestionsOverlappingPassages', () => {
  const suggestion: ReadingSuggestionPassage = { startVerseId: gen2v1, endVerseId: gen50v26 };

  it('keeps suggestions that do not overlap any entry', () => {
    const entries: ReadingSuggestionPassage[] = [{ startVerseId: exo1v1, endVerseId: exo1v22 }];
    expect(filterSuggestionsOverlappingPassages([suggestion], entries)).toEqual([suggestion]);
  });

  it('removes suggestions fully covered by an entry', () => {
    const entries: ReadingSuggestionPassage[] = [{ startVerseId: gen1v1, endVerseId: gen50v26 }];
    expect(filterSuggestionsOverlappingPassages([suggestion], entries)).toEqual([]);
  });

  it('removes suggestions that partially overlap an entry', () => {
    const entries: ReadingSuggestionPassage[] = [{ startVerseId: gen50v26, endVerseId: exo1v22 }];
    expect(filterSuggestionsOverlappingPassages([suggestion], entries)).toEqual([]);
  });

  it('returns empty when given no suggestions', () => {
    expect(filterSuggestionsOverlappingPassages([], [{ startVerseId: gen1v1, endVerseId: exo1v22 }])).toEqual([]);
  });
});

describe('filterRangesByPassage', () => {
  const passage: ReadingSuggestionPassage = { startVerseId: gen2v1, endVerseId: gen50v26 };

  it('keeps ranges that overlap the passage', () => {
    const ranges = [
      { startVerseId: gen1v1, endVerseId: gen2v1 },
      { startVerseId: gen50v26, endVerseId: exo1v22 },
      { startVerseId: gen2v1, endVerseId: gen50v26 },
    ];
    expect(filterRangesByPassage(ranges, passage)).toHaveLength(3);
  });

  it('removes ranges entirely before the passage', () => {
    const ranges = [{ startVerseId: gen1v1, endVerseId: gen1v31 }];
    expect(filterRangesByPassage(ranges, passage)).toEqual([]);
  });

  it('removes ranges entirely after the passage', () => {
    const ranges = [{ startVerseId: exo1v1, endVerseId: exo1v22 }];
    expect(filterRangesByPassage(ranges, passage)).toEqual([]);
  });
});

describe('cropRangesByPassage', () => {
  const passage: ReadingSuggestionPassage = { startVerseId: gen2v1, endVerseId: gen50v26 };

  it('crops start of range to passage start', () => {
    const ranges = [{ startVerseId: gen1v1, endVerseId: gen50v26 }];
    const result = cropRangesByPassage(ranges, passage);
    expect(result[0].startVerseId).toBe(gen2v1);
    expect(result[0].endVerseId).toBe(gen50v26);
  });

  it('crops end of range to passage end', () => {
    const ranges = [{ startVerseId: gen2v1, endVerseId: exo1v22 }];
    const result = cropRangesByPassage(ranges, passage);
    expect(result[0].startVerseId).toBe(gen2v1);
    expect(result[0].endVerseId).toBe(gen50v26);
  });

  it('does not mutate input ranges', () => {
    const original = { startVerseId: gen1v1, endVerseId: exo1v22 };
    const ranges = [original];
    cropRangesByPassage(ranges, passage);
    expect(original.startVerseId).toBe(gen1v1);
    expect(original.endVerseId).toBe(exo1v22);
  });
});

describe('passageIsRead', () => {
  const passage: ReadingSuggestionPassage = { startVerseId: gen1v1, endVerseId: gen1v31 };

  it('returns true when all verses have been read', () => {
    const ranges: ReadingSuggestionPassage[] = [{ startVerseId: gen1v1, endVerseId: gen50v26 }];
    expect(passageIsRead(passage, ranges)).toBe(true);
  });

  it('returns false when the passage has not been read', () => {
    expect(passageIsRead(passage, [])).toBe(false);
  });

  it('returns false when only part of the passage has been read', () => {
    const ranges: ReadingSuggestionPassage[] = [{ startVerseId: gen1v1, endVerseId: gen1v1 }];
    expect(passageIsRead(passage, ranges)).toBe(false);
  });
});

describe('getBookChapterRanges', () => {
  it('returns one range per chapter in Genesis (50 chapters)', () => {
    expect(getBookChapterRanges(1)).toHaveLength(50);
  });

  it('returns ranges with startVerseId < endVerseId', () => {
    const ranges = getBookChapterRanges(1);
    for (const range of ranges) {
      expect(range.startVerseId).toBeLessThan(range.endVerseId);
    }
  });

  it('first range starts at verse 1 of chapter 1', () => {
    const ranges = getBookChapterRanges(1);
    expect(ranges[0].startVerseId).toBe(gen1v1);
  });
});

describe('getReadingPathSuggestions', () => {
  it('returns one suggestion per book when nothing has been read', () => {
    const suggestions = getReadingPathSuggestions([1, 2], []);
    expect(suggestions).toHaveLength(2);
  });

  it('returns empty when all books are fully read', () => {
    const allRead: ReadingSuggestionPassage[] = [{ startVerseId: gen1v1, endVerseId: gen50v26 }];
    const suggestions = getReadingPathSuggestions([1], allRead);
    expect(suggestions).toHaveLength(0);
  });

  it('skips chapter 1 when it has been read, suggesting chapter 2', () => {
    const ch1Read: ReadingSuggestionPassage[] = [{ startVerseId: gen1v1, endVerseId: gen1v31 }];
    const suggestions = getReadingPathSuggestions([1], ch1Read);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].startVerseId).toBe(gen2v1);
  });
});
