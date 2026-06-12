// Main exports
export { default as Bible } from './bible';
export { default as SimpleDate } from './simple-date';
export { default as BrowserCache } from './browser-cache';

// Utility exports
export * from './bible-apps';
export * from './device';
export * from './date-helpers';

// i18n exports
export * from './i18n';

// Scripture passage types (provider-neutral)
export type {
  PassageBlock,
  PassageCursor,
  PassageTranslation,
  PassageVerseSegment,
  ScripturePassageChunk,
} from './scripture';

// Static data exports
export { default as bibleBooks } from './static/bible-books';
export { default as chapterVerses } from './static/chapter-verses/nasb';

// Type exports
export type { BibleBook } from './static/bible-books';
export type { ParsedVerseId, Segment, VerseId, VerseRange } from './bible';
