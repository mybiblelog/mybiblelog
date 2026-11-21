import { expect, test } from 'vitest';
import { displayVerseRange } from './display.js';
import { makeVerseId } from './encoding.js';

test('displays a cross-chapter range of whole chapters without verse numbers', () => {
  const startVerseId = makeVerseId(1, 1, 1);
  const endVerseId = makeVerseId(1, 2, 25); // Genesis 2 has 25 verses
  const result = displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Genesis 1-2');
});
