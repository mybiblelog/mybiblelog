import { describe, expect, it } from 'vitest';
import Bible from '../bible';
import {
  evaluateAchievement,
  getBookIndexFromVerseId,
  isBibleComplete,
  isBookComplete,
} from './rules';

const OBADIAH = 31; // single chapter, 21 verses — easiest book to complete

const wholeObadiah = {
  startVerseId: Bible.makeVerseId(OBADIAH, 1, 1),
  endVerseId: Bible.makeVerseId(OBADIAH, 1, Bible.getChapterVerseCount(OBADIAH, 1)),
};

const partialObadiah = {
  startVerseId: Bible.makeVerseId(OBADIAH, 1, 1),
  endVerseId: Bible.makeVerseId(OBADIAH, 1, 5),
};

describe('getBookIndexFromVerseId', () => {
  it('extracts the book index', () => {
    expect(getBookIndexFromVerseId(Bible.makeVerseId(43, 3, 16))).toBe(43);
  });
});

describe('isBookComplete', () => {
  it('is true only when every verse is read', () => {
    expect(isBookComplete(OBADIAH, [partialObadiah])).toBe(false);
    expect(isBookComplete(OBADIAH, [wholeObadiah])).toBe(true);
  });
});

describe('isBibleComplete', () => {
  it('is false for a partial log', () => {
    expect(isBibleComplete([wholeObadiah])).toBe(false);
  });
});

describe('evaluateAchievement', () => {
  it('fires a book achievement when a book is newly completed', () => {
    const event = evaluateAchievement(OBADIAH, [partialObadiah], [wholeObadiah]);
    expect(event).toEqual({ type: 'book', bookIndex: OBADIAH });
  });

  it('does not fire when the book was already complete', () => {
    expect(evaluateAchievement(OBADIAH, [wholeObadiah], [wholeObadiah])).toBeNull();
  });

  it('does not fire when the book is still incomplete', () => {
    expect(evaluateAchievement(OBADIAH, [], [partialObadiah])).toBeNull();
  });

  it('fires a bible achievement (not a book achievement) when completing the last book finishes the whole Bible', () => {
    const totalBooks = Bible.getBookCount();
    const wholeBook = (bookIndex: number) => {
      const lastChapter = Bible.getBookChapterCount(bookIndex);
      return {
        startVerseId: Bible.makeVerseId(bookIndex, 1, 1),
        endVerseId: Bible.makeVerseId(
          bookIndex,
          lastChapter,
          Bible.getChapterVerseCount(bookIndex, lastChapter),
        ),
      };
    };

    const before = [];
    for (let bookIndex = 1; bookIndex < totalBooks; bookIndex++) {
      before.push(wholeBook(bookIndex));
    }
    before.push({
      startVerseId: Bible.makeVerseId(totalBooks, 1, 1),
      endVerseId: Bible.makeVerseId(totalBooks, 1, 1),
    });
    const after = [...before.slice(0, -1), wholeBook(totalBooks)];

    const event = evaluateAchievement(totalBooks, before, after);
    expect(event).toEqual({ type: 'bible' });
  });
});
