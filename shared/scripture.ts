/**
 * Provider-neutral types for displaying scripture passage text.
 *
 * These types describe what the `/api/scripture/passage` endpoint returns
 * and what the frontend renders. They intentionally contain no details about
 * any upstream Bible text provider.
 */

/** A piece of inline verse content. */
export type PassageVerseSegment =
  | { kind: 'text'; text: string; wordsOfJesus?: boolean; poem?: number }
  | { kind: 'line_break' };

/** A section heading (from the translation) or a verse, in reading order. */
export type PassageBlock =
  | { type: 'section_heading'; chapter: number; text: string }
  | { type: 'verse'; chapter: number; number: number; segments: PassageVerseSegment[] };

/** Display/attribution metadata for the translation a passage was loaded from. */
export type PassageTranslation = {
  name: string;
  licenseUrl: string;
};

/** Cursor identifying the remainder of a passage that has not been loaded yet. */
export type PassageCursor = {
  startVerseId: number;
  endVerseId: number;
};

/**
 * One chunk of a passage. When `next` is non-null, the passage continues;
 * re-request the endpoint with `next`'s verse ids to load the following chunk.
 */
export type ScripturePassageChunk = {
  blocks: PassageBlock[];
  translation: PassageTranslation;
  next: PassageCursor | null;
};
