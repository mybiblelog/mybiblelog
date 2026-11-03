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

  test('returns an empty string for invalid or cross-book ranges', () => {
    expect(Bible.formatUsfmReference(v(1, 1, 5), v(1, 1, 1))).toBe('');
    expect(Bible.formatUsfmReference(v(1, 50, 26), v(2, 1, 1))).toBe('');
  });

  test('round-trips through parseUsfmReference', () => {
    const ranges = [
      [v(1, 1, 1), v(1, 50, 26)],
      [v(19, 119, 1), v(19, 119, 176)],
      [v(19, 1, 1), v(19, 150, 5)],
      [v(43, 3, 16), v(43, 4, 2)],
      [v(45, 8, 28), v(45, 8, 30)],
      [v(66, 22, 21), v(66, 22, 21)],
      [v(40, 5, 1), v(40, 7, 29)],
      [v(40, 5, 2), v(40, 7, 29)],
    ];
    for (const [startVerseId, endVerseId] of ranges) {
      const reference = Bible.formatUsfmReference(startVerseId, endVerseId);
      expect(Bible.parseUsfmReference(reference)).toEqual({ startVerseId, endVerseId });
    }
  });
});
