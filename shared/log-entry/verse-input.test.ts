import { describe, expect, it } from 'vitest';
import Bible from '../bible';
import { coerceVerseRange, formatVerseRange, parseVerseInput } from './verse-input';

const john316 = Bible.makeVerseId(43, 3, 16);
const john318 = Bible.makeVerseId(43, 3, 18);

describe('parseVerseInput', () => {
  it('treats empty text as valid with no range', () => {
    expect(parseVerseInput('   ')).toEqual({ range: null, isValid: true, hasText: false });
  });

  it('parses a single verse', () => {
    const result = parseVerseInput('John 3:16');
    expect(result.hasText).toBe(true);
    expect(result.isValid).toBe(true);
    expect(result.range).toEqual({ startVerseId: john316, endVerseId: john316 });
  });

  it('rejects a multi-verse range in single-verse mode', () => {
    const result = parseVerseInput('John 3:16-18', { multiVerse: false });
    expect(result.range).toEqual({ startVerseId: john316, endVerseId: john318 });
    expect(result.isValid).toBe(false);
  });

  it('accepts a multi-verse range in multi-verse mode', () => {
    const result = parseVerseInput('John 3:16-18', { multiVerse: true });
    expect(result.isValid).toBe(true);
  });

  it('flags unparseable text as invalid', () => {
    const result = parseVerseInput('not a verse', { multiVerse: true });
    expect(result.range).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.hasText).toBe(true);
  });
});

describe('coerceVerseRange', () => {
  it('coerces string ids to numbers', () => {
    expect(coerceVerseRange({ startVerseId: '143003016', endVerseId: '143003016' }))
      .toEqual({ startVerseId: john316, endVerseId: john316 });
  });

  it('returns null for missing or non-finite ids', () => {
    expect(coerceVerseRange(null)).toBeNull();
    expect(coerceVerseRange({ startVerseId: 'x', endVerseId: 1 })).toBeNull();
  });
});

describe('formatVerseRange', () => {
  it('round-trips through the Bible formatter', () => {
    expect(formatVerseRange({ startVerseId: john316, endVerseId: john316 }))
      .toBe(Bible.displayVerseRange(john316, john316, 'en'));
  });
});
