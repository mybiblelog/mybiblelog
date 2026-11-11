import { describe, expect, test } from 'vitest';
import Bible from './index';

const v = Bible.makeVerseId;

describe('getBookIndexByUsfmCode', () => {
  test('finds books case-insensitively', () => {
    expect(Bible.getBookIndexByUsfmCode('GEN')).toBe(1);
    expect(Bible.getBookIndexByUsfmCode('1sa')).toBe(9);
    expect(Bible.getBookIndexByUsfmCode('Rev')).toBe(66);
  });

  test('returns -1 for unknown codes', () => {
    expect(Bible.getBookIndexByUsfmCode('XYZ')).toBe(-1);
    expect(Bible.getBookIndexByUsfmCode('')).toBe(-1);
  });
});

describe('parseUsfmReference', () => {
  test.each([
    ['GEN', v(1, 1, 1), v(1, 50, 26)],
    ['GEN.1', v(1, 1, 1), v(1, 1, 31)],
    ['GEN.1-3', v(1, 1, 1), v(1, 3, 24)],
    ['GEN.1.1', v(1, 1, 1), v(1, 1, 1)],
    ['GEN.1.1-5', v(1, 1, 1), v(1, 1, 5)],
    ['GEN.1.1-2.3', v(1, 1, 1), v(1, 2, 3)],
    ['JHN.3.16-18', v(43, 3, 16), v(43, 3, 18)],
    ['PSA.23', v(19, 23, 1), v(19, 23, 6)],
    ['1SA.17.4', v(9, 17, 4), v(9, 17, 4)],
    ['jhn.3.16', v(43, 3, 16), v(43, 3, 16)],
    [' gen.01.001 ', v(1, 1, 1), v(1, 1, 1)],
    ['GEN.1.1-GEN.2.3', v(1, 1, 1), v(1, 2, 3)],
    ['GEN.1.1-GEN.1.5', v(1, 1, 1), v(1, 1, 5)],
    ['GEN.1-GEN.3', v(1, 1, 1), v(1, 3, 24)],
    ['1sa.17.4-1SA.18.2', v(9, 17, 4), v(9, 18, 2)],
    ['PSA.118.1-119.5', v(19, 118, 1), v(19, 119, 5)],
  ])('%s', (reference, startVerseId, endVerseId) => {
    expect(Bible.parseUsfmReference(reference)).toEqual({ startVerseId, endVerseId });
  });

  test.each([
    '',
    'XYZ.1.1',
    'GEN.0',
    'GEN.51',
    'GEN.1.0',
    'GEN.1.32',
    'GEN.1.5-3',
    'GEN.3-1',
    'GEN.1.1-50.27',
    'GEN-2',
    'GEN.1-2.3',
    'GEN-EXO',
    'GEN.1-EXO.1',
    'GEN.1.1-EXO.2.3',
    'GEN-GEN',
    'GEN-GEN.2',
    'GEN.1.1-GEN.5',
    'GEN.1-GEN.2.3',
    'GEN.1.1-GEN',
    'GEN.1.1.1',
    'GEN 1:1',
    'GEN.1.1x',
  ])('rejects %j', (reference) => {
    expect(Bible.parseUsfmReference(reference)).toBeNull();
  });
});

describe('formatUsfmReference', () => {
  test.each([
    [v(1, 1, 1), v(1, 50, 26), 'GEN'],
    [v(1, 1, 1), v(1, 1, 31), 'GEN.1'],
    [v(1, 1, 1), v(1, 3, 24), 'GEN.1-3'],
    [v(1, 1, 1), v(1, 1, 1), 'GEN.1.1'],
    [v(1, 1, 1), v(1, 1, 5), 'GEN.1.1-5'],
    [v(1, 1, 1), v(1, 2, 3), 'GEN.1.1-2.3'],
    [v(31, 1, 1), v(31, 1, 21), 'OBA'],
  ])('%i-%i → %s', (startVerseId, endVerseId, expected) => {
    expect(Bible.formatUsfmReference(startVerseId, endVerseId)).toBe(expected);
  });

  test('returns null for invalid or cross-book ranges', () => {
    expect(Bible.formatUsfmReference(v(1, 1, 5), v(1, 1, 1))).toBeNull();
    expect(Bible.formatUsfmReference(v(1, 50, 26), v(2, 1, 1))).toBeNull();
  });

  test('round-trips every chapter of every book through parseUsfmReference', () => {
    const ranges: Array<[number, number]> = [];
    for (let book = 1; book <= Bible.getBookCount(); book++) {
      const chapterCount = Bible.getBookChapterCount(book);
      ranges.push([Bible.getFirstBookVerseId(book), Bible.getLastBookVerseId(book)]);
      for (let chapter = 1; chapter <= chapterCount; chapter++) {
        const last = Bible.getChapterVerseCount(book, chapter);
        ranges.push(
          [v(book, chapter, 1), v(book, chapter, last)],
          [v(book, chapter, 1), v(book, chapter, 1)],
          [v(book, chapter, last), v(book, chapter, last)],
        );
        if (last > 1) {
          ranges.push([v(book, chapter, 2), v(book, chapter, last)]);
        }
        if (chapter < chapterCount) {
          ranges.push(
            [v(book, chapter, last), v(book, chapter + 1, 1)],
            [v(book, chapter, 1), v(book, chapter + 1, Bible.getChapterVerseCount(book, chapter + 1))],
          );
        }
      }
    }
    for (const [startVerseId, endVerseId] of ranges) {
      const reference = Bible.formatUsfmReference(startVerseId, endVerseId);
      expect(reference && Bible.parseUsfmReference(reference), `${startVerseId}-${endVerseId} as ${reference}`)
        .toEqual({ startVerseId, endVerseId });
    }
  });
});
