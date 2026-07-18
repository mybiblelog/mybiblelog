import { describe, expect, it } from 'vitest';
import {
  compareByLabelAsc,
  getObjectIdCreatedMsOrNull,
  getTagCreatedMsOrNull,
  hexToRgb,
  makeTagComparator,
  normalizeHexColor,
  normalizeSortOrder,
  rgbToHue,
  sortPassageNoteTags,
  type PassageNoteTag,
} from './sort';

const tag = (overrides: Partial<PassageNoteTag> & { id: number | string }): PassageNoteTag => ({ ...overrides });

const labels = (tags: PassageNoteTag[]): Array<string | undefined> => tags.map(t => t.label);

describe('normalizeSortOrder', () => {
  it('accepts every known sort order', () => {
    expect(normalizeSortOrder('color:hue')).toBe('color:hue');
    expect(normalizeSortOrder('createdAt:ascending')).toBe('createdAt:ascending');
    expect(normalizeSortOrder('noteCount:descending')).toBe('noteCount:descending');
  });

  it('falls back to label:ascending for anything unrecognized', () => {
    expect(normalizeSortOrder('bogus')).toBe('label:ascending');
    expect(normalizeSortOrder(undefined)).toBe('label:ascending');
    expect(normalizeSortOrder(null)).toBe('label:ascending');
  });
});

describe('normalizeHexColor', () => {
  it('expands shorthand hex and adds a leading hash', () => {
    expect(normalizeHexColor('abc')).toBe('#aabbcc');
    expect(normalizeHexColor('#ABC')).toBe('#aabbcc');
  });

  it('lowercases and passes through full hex', () => {
    expect(normalizeHexColor('#AABBCC')).toBe('#aabbcc');
  });

  it('returns null for invalid input', () => {
    expect(normalizeHexColor('')).toBeNull();
    expect(normalizeHexColor('#12')).toBeNull();
    expect(normalizeHexColor('not-a-color')).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
  });
});

describe('hexToRgb and rgbToHue', () => {
  it('parses hex into channel values', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('0f0')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('nope')).toBeNull();
  });

  it('derives the correct hue for primary colors', () => {
    expect(rgbToHue({ r: 255, g: 0, b: 0 })).toBe(0);
    expect(rgbToHue({ r: 0, g: 255, b: 0 })).toBe(120);
    expect(rgbToHue({ r: 0, g: 0, b: 255 })).toBe(240);
  });

  it('returns null (no hue) for greys', () => {
    expect(rgbToHue({ r: 128, g: 128, b: 128 })).toBeNull();
  });
});

describe('getObjectIdCreatedMsOrNull', () => {
  it('decodes the timestamp embedded in a Mongo ObjectId', () => {
    // First 8 hex chars = seconds since epoch. 0x5f000000 = 1593820160s.
    expect(getObjectIdCreatedMsOrNull('5f000000aaaaaaaaaaaaaaaa')).toBe(0x5f000000 * 1000);
  });

  it('returns null for anything that is not a 24-char hex string', () => {
    expect(getObjectIdCreatedMsOrNull(123)).toBeNull();
    expect(getObjectIdCreatedMsOrNull('short')).toBeNull();
    expect(getObjectIdCreatedMsOrNull('zzzz0000aaaaaaaaaaaaaaaa')).toBeNull();
    expect(getObjectIdCreatedMsOrNull(null)).toBeNull();
  });
});

describe('getTagCreatedMsOrNull', () => {
  it('prefers an explicit createdAt date', () => {
    expect(getTagCreatedMsOrNull(tag({ id: 1, createdAt: '2026-01-02T00:00:00.000Z' })))
      .toBe(Date.parse('2026-01-02T00:00:00.000Z'));
  });

  it('falls back to an ObjectId id when createdAt is absent', () => {
    expect(getTagCreatedMsOrNull(tag({ id: '5f000000aaaaaaaaaaaaaaaa' }))).toBe(0x5f000000 * 1000);
  });

  it('falls back to _id when id is not an ObjectId', () => {
    expect(getTagCreatedMsOrNull(tag({ id: 7, _id: '5f000000aaaaaaaaaaaaaaaa' }))).toBe(0x5f000000 * 1000);
  });

  it('returns null when no timestamp can be recovered', () => {
    expect(getTagCreatedMsOrNull(tag({ id: 7 }))).toBeNull();
    expect(getTagCreatedMsOrNull(null)).toBeNull();
  });
});

describe('compareByLabelAsc', () => {
  it('ignores leading punctuation when comparing labels', () => {
    const sorted = [tag({ id: 1, label: 'Banana' }), tag({ id: 2, label: '*Apple' })].sort(compareByLabelAsc);
    expect(labels(sorted)).toEqual(['*Apple', 'Banana']);
  });

  it('is case-insensitive and numeric-aware', () => {
    const sorted = [
      tag({ id: 1, label: 'item 10' }),
      tag({ id: 2, label: 'item 2' }),
    ].sort(compareByLabelAsc);
    expect(labels(sorted)).toEqual(['item 2', 'item 10']);
  });

  it('breaks ties by id when labels are equivalent', () => {
    const sorted = [tag({ id: 'b', label: 'Same' }), tag({ id: 'a', label: 'Same' })].sort(compareByLabelAsc);
    expect(sorted.map(t => t.id)).toEqual(['a', 'b']);
  });
});

describe('sortPassageNoteTags', () => {
  it('sorts by label ascending by default', () => {
    const tags = [tag({ id: 1, label: 'Charlie' }), tag({ id: 2, label: 'alpha' }), tag({ id: 3, label: 'Bravo' })];
    expect(labels(sortPassageNoteTags(tags, 'label:ascending'))).toEqual(['alpha', 'Bravo', 'Charlie']);
  });

  it('sorts by hue, placing hueless colors last', () => {
    const tags = [
      tag({ id: 1, label: 'blue', color: '#0000ff' }),
      tag({ id: 2, label: 'grey', color: '#808080' }),
      tag({ id: 3, label: 'red', color: '#ff0000' }),
      tag({ id: 4, label: 'green', color: '#00ff00' }),
    ];
    expect(labels(sortPassageNoteTags(tags, 'color:hue'))).toEqual(['red', 'green', 'blue', 'grey']);
  });

  it('sorts by note count descending, tie-breaking on label', () => {
    const tags = [
      tag({ id: 1, label: 'few', noteCount: 1 }),
      tag({ id: 2, label: 'many', noteCount: 9 }),
      tag({ id: 3, label: 'none' }),
    ];
    expect(labels(sortPassageNoteTags(tags, 'noteCount:descending'))).toEqual(['many', 'few', 'none']);
  });

  it('sorts by createdAt ascending using the ObjectId fallback', () => {
    const older = '4f000000aaaaaaaaaaaaaaaa';
    const newer = '5f000000aaaaaaaaaaaaaaaa';
    const tags = [tag({ id: newer, label: 'newer' }), tag({ id: older, label: 'older' })];
    expect(labels(sortPassageNoteTags(tags, 'createdAt:ascending'))).toEqual(['older', 'newer']);
  });

  it('sorts in place and returns the same array reference', () => {
    const tags = [tag({ id: 1, label: 'B' }), tag({ id: 2, label: 'A' })];
    const result = sortPassageNoteTags(tags, 'label:ascending');
    expect(result).toBe(tags);
  });
});

describe('makeTagComparator', () => {
  it('returns the label comparator for an unknown order (via default branch)', () => {
    const comparator = makeTagComparator('label:ascending');
    expect(comparator(tag({ id: 1, label: 'A' }), tag({ id: 2, label: 'B' }))).toBeLessThan(0);
  });
});
