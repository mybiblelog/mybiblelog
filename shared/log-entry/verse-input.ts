import Bible from '../bible';
import type { VerseRange } from '../bible';

export type ParseVerseInputOptions = {
  locale?: string;
  /** When false, only single-verse ranges (start === end) are considered valid. */
  multiVerse?: boolean;
};

export type ParsedVerseInput = {
  /** The parsed range, or null when the text is empty or unparseable. */
  range: VerseRange | null;
  /**
   * Whether the current text is acceptable. Empty text is considered valid
   * (nothing entered yet); non-empty text is valid only when it parses and,
   * for single-verse inputs, resolves to a single verse.
   */
  isValid: boolean;
  /** True when there is non-whitespace text present. */
  hasText: boolean;
};

/**
 * Coerces a loose `{ startVerseId, endVerseId }` value into a numeric
 * `VerseRange`, or null when either id is missing/non-finite.
 */
export const coerceVerseRange = (value: unknown): VerseRange | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const startVerseId = Number((value as Record<string, unknown>).startVerseId);
  const endVerseId = Number((value as Record<string, unknown>).endVerseId);
  if (!Number.isFinite(startVerseId) || !Number.isFinite(endVerseId)) {
    return null;
  }
  return { startVerseId, endVerseId };
};

/**
 * Parses and validates free-text verse-range input (e.g. "John 3:16-18").
 * Framework-agnostic: a component or hook supplies the raw text and gets back
 * the parsed range plus validity, with no knowledge of how it is rendered.
 */
export const parseVerseInput = (
  text: string,
  { locale = 'en', multiVerse = false }: ParseVerseInputOptions = {},
): ParsedVerseInput => {
  const raw = String(text ?? '').trim();
  const hasText = raw.length > 0;

  if (!hasText) {
    return { range: null, isValid: true, hasText: false };
  }

  let range: VerseRange | null = null;
  try {
    range = Bible.parseVerseRange(raw, locale) || null;
  }
  catch {
    range = null;
  }

  if (!range) {
    return { range: null, isValid: false, hasText: true };
  }

  const isSingleVerse = range.startVerseId === range.endVerseId;
  const isValid = multiVerse ? true : isSingleVerse;

  return { range, isValid, hasText: true };
};

/**
 * Formats a range back to display text using the shared Bible formatter.
 * Thin convenience wrapper so callers don't need to import `Bible` directly
 * just to round-trip a range.
 */
export const formatVerseRange = (range: VerseRange, locale = 'en'): string =>
  Bible.displayVerseRange(range.startVerseId, range.endVerseId, locale);
