import { describe, expect, it } from 'vitest';
import { Bible } from '@mybiblelog/shared';
import { ValidationError } from '../router/errors/validation-errors';
import {
  extractPassageBlocksFromChapter,
  extractTranslationMeta,
} from '../services/scripture/helloao-parser';
import {
  HELLOAO_DEFAULT_TRANSLATION_ID,
  getHelloaoTranslationId,
} from '../services/scripture/helloao-translations';
import { computePassageChunkBounds } from '../services/scripture/scripture.service';

describe('helloao-parser', () => {
  it('extractPassageBlocksFromChapter filters verses by range and stamps the chapter', () => {
    const payload = {
      chapter: {
        content: [
          { type: 'heading', content: ['Title'] },
          { type: 'verse', number: 1, content: ['A'] },
          { type: 'verse', number: 2, content: ['B'] },
          { type: 'verse', number: 3, content: ['C'] },
          { type: 'verse', number: 4, content: ['D'] },
        ],
      },
    };
    const blocks = extractPassageBlocksFromChapter(payload, 5, 2, 3);
    expect(blocks).toEqual([
      { type: 'verse', chapter: 5, number: 2, segments: [{ kind: 'text', text: 'B' }] },
      { type: 'verse', chapter: 5, number: 3, segments: [{ kind: 'text', text: 'C' }] },
    ]);
  });

  it('attaches section headings to the next in-range verse', () => {
    const payload = {
      chapter: {
        content: [
          { type: 'heading', content: ['The Creation'] },
          { type: 'verse', number: 1, content: ['A'] },
          { type: 'heading', content: ['The Second Day'] },
          { type: 'verse', number: 2, content: ['B'] },
          { type: 'verse', number: 3, content: ['C'] },
        ],
      },
    };
    const blocks = extractPassageBlocksFromChapter(payload, 1, 2, 3);
    expect(blocks.map((b) => b.type)).toEqual(['section_heading', 'verse', 'verse']);
    expect(blocks[0]).toMatchObject({ type: 'section_heading', chapter: 1, text: 'The Second Day' });
  });

  it('drops a heading whose next verse is out of range', () => {
    const payload = {
      chapter: {
        content: [
          { type: 'verse', number: 1, content: ['A'] },
          { type: 'heading', content: ['Later Section'] },
          { type: 'verse', number: 2, content: ['B'] },
        ],
      },
    };
    const blocks = extractPassageBlocksFromChapter(payload, 1, 1, 1);
    expect(blocks).toEqual([
      { type: 'verse', chapter: 1, number: 1, segments: [{ kind: 'text', text: 'A' }] },
    ]);
  });

  it('skips footnote references and preserves formatted segments', () => {
    const payload = {
      chapter: {
        content: [
          {
            type: 'verse',
            number: 1,
            content: [
              'He said, ',
              { text: 'Follow me', wordsOfJesus: true },
              { noteId: 7 },
              { lineBreak: true },
              { text: 'A poem line', poem: 2 },
            ],
          },
        ],
      },
    };
    const blocks = extractPassageBlocksFromChapter(payload, 3, 1, 1);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: 'verse',
      chapter: 3,
      number: 1,
      segments: [
        { kind: 'text', text: 'He said, ' },
        { kind: 'text', text: 'Follow me', wordsOfJesus: true, poem: undefined },
        { kind: 'line_break' },
        { kind: 'text', text: 'A poem line', wordsOfJesus: undefined, poem: 2 },
      ],
    });
  });

  it('returns an empty array for malformed payloads', () => {
    expect(extractPassageBlocksFromChapter(null, 1, 1, 10)).toEqual([]);
    expect(extractPassageBlocksFromChapter('nope', 1, 1, 10)).toEqual([]);
    expect(extractPassageBlocksFromChapter({}, 1, 1, 10)).toEqual([]);
    expect(extractPassageBlocksFromChapter({ chapter: { content: 'bad' } }, 1, 1, 10)).toEqual([]);
  });

  it('extractTranslationMeta prefers englishName, falls back to name, then to the fallback', () => {
    expect(extractTranslationMeta(
      { translation: { englishName: 'Berean Standard Bible', name: 'BSB', licenseUrl: 'https://example.com' } },
      'fallback',
    )).toEqual({ name: 'Berean Standard Bible', licenseUrl: 'https://example.com' });

    expect(extractTranslationMeta(
      { translation: { name: 'Localized Name' } },
      'fallback',
    )).toEqual({ name: 'Localized Name', licenseUrl: '' });

    expect(extractTranslationMeta({}, 'fallback')).toEqual({ name: 'fallback', licenseUrl: '' });
    expect(extractTranslationMeta(null, 'fallback')).toEqual({ name: 'fallback', licenseUrl: '' });
  });
});

describe('computePassageChunkBounds', () => {
  it('covers a single-chapter passage in one chunk with no continuation', () => {
    const bounds = computePassageChunkBounds(
      Bible.makeVerseId(1, 1, 1),
      Bible.makeVerseId(1, 1, 5),
    );
    expect(bounds).toEqual({
      usfm: 'GEN',
      chapter: 1,
      fromVerse: 1,
      toVerse: 5,
      next: null,
    });
  });

  it('chunks a cross-chapter passage at the chapter boundary with a continuation cursor', () => {
    const endVerseId = Bible.makeVerseId(1, 2, 3);
    const bounds = computePassageChunkBounds(Bible.makeVerseId(1, 1, 30), endVerseId);
    expect(bounds).toEqual({
      usfm: 'GEN',
      chapter: 1,
      fromVerse: 30,
      toVerse: Bible.getChapterVerseCount(1, 1),
      next: {
        startVerseId: Bible.makeVerseId(1, 2, 1),
        endVerseId,
      },
    });
  });

  it('walks a three-chapter range to completion via continuation cursors', () => {
    const endVerseId = Bible.makeVerseId(1, 3, 5);
    let cursor = { startVerseId: Bible.makeVerseId(1, 1, 5), endVerseId };
    const chunks = [];
    for (let i = 0; i < 10; i += 1) {
      const bounds = computePassageChunkBounds(cursor.startVerseId, cursor.endVerseId);
      chunks.push(bounds);
      if (!bounds.next) { break; }
      cursor = bounds.next;
    }
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.chapter)).toEqual([1, 2, 3]);
    expect(chunks[0].fromVerse).toBe(5);
    expect(chunks[0].toVerse).toBe(Bible.getChapterVerseCount(1, 1));
    expect(chunks[1].fromVerse).toBe(1);
    expect(chunks[1].toVerse).toBe(Bible.getChapterVerseCount(1, 2));
    expect(chunks[2].fromVerse).toBe(1);
    expect(chunks[2].toVerse).toBe(5);
    expect(chunks[2].next).toBeNull();
  });

  it('throws a ValidationError for a reversed range', () => {
    expect(() => computePassageChunkBounds(
      Bible.makeVerseId(1, 1, 10),
      Bible.makeVerseId(1, 1, 1),
    )).toThrow(ValidationError);
  });

  it('throws a ValidationError for a cross-book range', () => {
    expect(() => computePassageChunkBounds(
      Bible.makeVerseId(1, 50, 1),
      Bible.makeVerseId(2, 1, 1),
    )).toThrow(ValidationError);
  });

  it('throws a ValidationError for nonexistent verses', () => {
    expect(() => computePassageChunkBounds(
      Bible.makeVerseId(1, 1, 1),
      Bible.makeVerseId(1, 1, 999),
    )).toThrow(ValidationError);
  });

  it('uses correct USFM codes for irregularly-abbreviated books', () => {
    const usfmFor = (book: number) => computePassageChunkBounds(
      Bible.makeVerseId(book, 1, 1),
      Bible.makeVerseId(book, 1, 2),
    ).usfm;
    expect(usfmFor(22)).toBe('SNG'); // Song of Solomon
    expect(usfmFor(29)).toBe('JOL'); // Joel
    expect(usfmFor(32)).toBe('JON'); // Jonah
    expect(usfmFor(34)).toBe('NAM'); // Nahum
    expect(usfmFor(36)).toBe('ZEP'); // Zephaniah
  });
});

describe('getHelloaoTranslationId', () => {
  it('maps app Bible versions to HelloAO translation ids', () => {
    expect(getHelloaoTranslationId('KJV')).toBe('eng_cpb');
    expect(getHelloaoTranslationId('RVR1960')).toBe('spa_r09');
    expect(getHelloaoTranslationId('RVR2020')).toBe('spa_r09');
    expect(getHelloaoTranslationId('UKR')).toBe('ukr_1996');
    expect(getHelloaoTranslationId('BDS')).toBe('fra_lsg');
    expect(getHelloaoTranslationId('LSG')).toBe('fra_lsg');
    expect(getHelloaoTranslationId('ARC')).toBe('por_bsl');
    expect(getHelloaoTranslationId('LUT')).toBe('deu_l12');
    expect(getHelloaoTranslationId('KLB')).toBe('kor_old');
    expect(getHelloaoTranslationId('KRV')).toBe('kor_old');
  });

  it('uses the default translation for versions without a HelloAO equivalent', () => {
    expect(getHelloaoTranslationId('NASB2020')).toBe(HELLOAO_DEFAULT_TRANSLATION_ID);
    expect(getHelloaoTranslationId('ESV')).toBe(HELLOAO_DEFAULT_TRANSLATION_ID);
    expect(getHelloaoTranslationId('MSG')).toBe(HELLOAO_DEFAULT_TRANSLATION_ID);
  });
});
