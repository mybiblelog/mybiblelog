import { type PassageBlock, type PassageTranslation, type PassageVerseSegment } from '@mybiblelog/shared';

type FormattedText = { text: string; poem?: number; wordsOfJesus?: boolean };
type VerseFootnoteReference = { noteId: number };
type InlineHeading = { heading: string };
type InlineLineBreak = { lineBreak: true };

type VerseContentPiece =
  | string
  | FormattedText
  | InlineHeading
  | InlineLineBreak
  | VerseFootnoteReference;

type ChapterContentItem =
  | { type: 'verse'; number: number; content: VerseContentPiece[] }
  | { type: string; [key: string]: unknown };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const pushSegmentsFromContent = (
  segments: PassageVerseSegment[],
  content: VerseContentPiece[],
): void => {
  for (const piece of content) {
    if (typeof piece === 'string') {
      if (piece.length) {
        segments.push({ kind: 'text', text: piece });
      }
      continue;
    }
    if (!isRecord(piece)) {
      continue;
    }
    // Footnote references are not displayed
    if ('noteId' in piece && typeof piece.noteId === 'number') {
      continue;
    }
    if ('lineBreak' in piece && piece.lineBreak === true) {
      segments.push({ kind: 'line_break' });
      continue;
    }
    if ('heading' in piece && typeof piece.heading === 'string') {
      if (piece.heading.length) {
        segments.push({ kind: 'text', text: piece.heading });
      }
      continue;
    }
    if ('text' in piece && typeof piece.text === 'string') {
      const ft = piece as FormattedText;
      if (ft.text.length) {
        segments.push({
          kind: 'text',
          text: ft.text,
          wordsOfJesus: ft.wordsOfJesus,
          poem: ft.poem,
        });
      }
    }
  }
};

const headingTextFromContent = (raw: unknown): string => {
  if (!Array.isArray(raw)) {
    return '';
  }
  const parts = raw.filter((x): x is string => typeof x === 'string');
  return parts.join(' ').trim();
};

/**
 * Extracts section headings and verses in order from one HelloAO chapter payload,
 * constrained to an inclusive verse range. Headings attach to the next verse in
 * file order and are dropped if that verse is out of range. A malformed payload
 * yields an empty array.
 */
export const extractPassageBlocksFromChapter = (
  chapterPayload: unknown,
  chapter: number,
  minVerse: number,
  maxVerse: number,
): PassageBlock[] => {
  if (!isRecord(chapterPayload)) {
    return [];
  }
  const chapterData = chapterPayload.chapter;
  if (!isRecord(chapterData) || !Array.isArray(chapterData.content)) {
    return [];
  }
  const out: PassageBlock[] = [];
  let attachHeading: string | null = null;

  for (const item of chapterData.content as ChapterContentItem[]) {
    if (!isRecord(item) || typeof item.type !== 'string') {
      continue;
    }
    if (item.type === 'heading') {
      const text = headingTextFromContent(item.content);
      attachHeading = text.length ? text : null;
      continue;
    }
    if (item.type === 'line_break') {
      continue;
    }
    if (item.type !== 'verse') {
      continue;
    }
    const num = item.number;
    if (typeof num !== 'number') {
      continue;
    }
    if (num > maxVerse) {
      break;
    }
    if (num >= minVerse) {
      if (attachHeading !== null && attachHeading.length) {
        out.push({ type: 'section_heading', chapter, text: attachHeading });
        attachHeading = null;
      }
      const content = item.content;
      if (!Array.isArray(content)) {
        continue;
      }
      const segments: PassageVerseSegment[] = [];
      pushSegmentsFromContent(segments, content as VerseContentPiece[]);
      out.push({ type: 'verse', chapter, number: num, segments });
    }
    else {
      attachHeading = null;
    }
  }
  return out;
};

/**
 * Extracts translation display/attribution metadata from a HelloAO chapter payload.
 * Falls back to the given name when the payload provides none.
 */
export const extractTranslationMeta = (
  chapterPayload: unknown,
  fallbackName: string,
): PassageTranslation => {
  let name = '';
  let licenseUrl = '';
  if (isRecord(chapterPayload) && isRecord(chapterPayload.translation)) {
    const tr = chapterPayload.translation;
    if (typeof tr.englishName === 'string') {
      name = tr.englishName;
    }
    else if (typeof tr.name === 'string') {
      name = tr.name;
    }
    if (typeof tr.licenseUrl === 'string') {
      licenseUrl = tr.licenseUrl;
    }
  }
  return {
    name: name || fallbackName,
    licenseUrl,
  };
};
