import { describe, expect, it } from 'vitest';
import Bible from './index';
import { computeBibleProgress } from './progress';
import { getBookOptions } from './options';

const DEUTEROCANONICAL_BOOK_INDEXES = [67, 68, 69, 70, 71, 72, 73];

describe('deuterocanonical book data', () => {
  it('keeps the Protestant canon as the default (66 books, unchanged IDs)', () => {
    const books = Bible.getBooks();
    expect(books).toHaveLength(66);
    expect(books.every((b) => !b.deuterocanonical)).toBe(true);
    expect(Bible.getBookName(1, 'en')).toBe('Genesis');
    expect(Bible.getBookName(66, 'en')).toBe('Revelation');
  });

  it('exposes all 73 books, including the 7 deuterocanonical ones, via getAllBooks', () => {
    const all = Bible.getAllBooks();
    expect(all).toHaveLength(73);
    const dc = all.filter((b) => b.deuterocanonical).map((b) => b.bibleOrder);
    expect(dc).toEqual(DEUTEROCANONICAL_BOOK_INDEXES);
  });

  it('resolves names, chapter counts and verse counts for deuterocanonical books', () => {
    expect(Bible.getBookName(67, 'en')).toBe('Tobit');
    expect(Bible.getBookName(72, 'en')).toBe('Sirach');
    expect(Bible.getBookChapterCount(67)).toBe(14);
    expect(Bible.getBookChapterCount(72)).toBe(51);
    // Baruch's sixth chapter is the Letter of Jeremiah (NRSV structure).
    expect(Bible.getBookChapterCount(73)).toBe(6);
    expect(Bible.getChapterVerseCount(67, 1)).toBe(22);
    expect(Bible.getBookVerseCount(67)).toBeGreaterThan(0);
  });

  it('treats deuterocanonical verses as structurally valid', () => {
    expect(Bible.verseExists(Bible.makeVerseId(67, 1, 1))).toBe(true);
    expect(Bible.verseExists(Bible.makeVerseId(73, 6, 73))).toBe(true);
  });
});

describe('getBooksForCanon', () => {
  it('returns the 66 Protestant books in bibleOrder when DC is excluded', () => {
    const books = Bible.getBooksForCanon(false);
    expect(books).toHaveLength(66);
    expect(books.map((b) => b.bibleOrder)).toEqual(
      [...books.map((b) => b.bibleOrder)].sort((a, b) => a - b),
    );
  });

  it('interleaves DC books in NRSVUE display order when included', () => {
    const books = Bible.getBooksForCanon(true);
    expect(books).toHaveLength(73);
    // Sorted by dcBookOrder.
    const orders = books.map((b) => b.dcBookOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    // Tobit (67) and Judith (68) slot in right after Nehemiah (16) and before Esther (17).
    const names = books.map((b) => b.bibleOrder);
    const nehemiahAt = names.indexOf(16);
    expect(names[nehemiahAt + 1]).toBe(67); // Tobit
    expect(names[nehemiahAt + 2]).toBe(68); // Judith
    expect(names[nehemiahAt + 3]).toBe(17); // Esther
  });
});

describe('getTotalVerseCount', () => {
  it('defaults to the Protestant canon and grows when DC is included', () => {
    const protestant = Bible.getTotalVerseCount();
    const withDc = Bible.getTotalVerseCount(true);
    expect(protestant).toBe(31102);
    expect(withDc).toBeGreaterThan(protestant);
    const dcVerses = DEUTEROCANONICAL_BOOK_INDEXES.reduce(
      (sum, bookIndex) => sum + Bible.getBookVerseCount(bookIndex),
      0,
    );
    expect(withDc).toBe(protestant + dcVerses);
  });
});

describe('getBookOptions', () => {
  it('excludes DC books by default and includes them when requested', () => {
    expect(getBookOptions('en')).toHaveLength(66);
    const withDc = getBookOptions('en', true);
    expect(withDc).toHaveLength(73);
    expect(withDc.some((o) => o.value === 67)).toBe(true);
  });
});

describe('computeBibleProgress with deuterocanonical books', () => {
  const tobitRange = {
    startVerseId: Bible.makeVerseId(67, 1, 1),
    endVerseId: Bible.makeVerseId(67, 1, 22),
  };

  it('ignores DC reading and books when computing the Protestant canon', () => {
    const progress = computeBibleProgress([tobitRange]);
    expect(progress.books).toHaveLength(66);
    expect(progress.totalVerses).toBe(31102);
    expect(progress.versesRead).toBe(0);
  });

  it('counts DC reading and lists DC books when the full canon is selected', () => {
    const progress = computeBibleProgress([tobitRange], { includeDeuterocanonical: true });
    expect(progress.books).toHaveLength(73);
    expect(progress.totalVerses).toBe(Bible.getTotalVerseCount(true));
    expect(progress.versesRead).toBe(22);
    const tobit = progress.books.find((b) => b.bookIndex === 67);
    expect(tobit?.chapters[0]?.complete).toBe(true);
  });
});
