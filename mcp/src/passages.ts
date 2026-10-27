import { Bible } from '@mybiblelog/shared';

const USFM_SHAPE = /^[1-3A-Z][A-Z0-9]{2}(\.[0-9.-]*)?$/;

export type ResolvedPassage = {
  startVerseId: number;
  endVerseId: number;
  /** Shortest USFM reference, e.g. "JHN.3.16-18". */
  usfm: string;
  /** Human-readable reference, e.g. "John 3:16-18". */
  display: string;
};

export const describeRange = (startVerseId: number, endVerseId: number): ResolvedPassage => ({
  startVerseId,
  endVerseId,
  usfm: Bible.formatUsfmReference(startVerseId, endVerseId),
  display: Bible.displayVerseRange(startVerseId, endVerseId, 'en'),
});

/**
 * Resolves a passage written as a USFM reference ("JHN.3.16-18") or in plain
 * English ("John 3:16-18", "Psalm 23"). Returns null when it names no single,
 * valid range in one book.
 */
export const resolvePassage = (text: string): ResolvedPassage | null => {
  const raw = text.trim();
  if (!raw) { return null; }

  const usfm = Bible.parseUsfmReference(raw);
  if (usfm) { return describeRange(usfm.startVerseId, usfm.endVerseId); }
  // Something written as USFM but invalid (e.g. "MAL.5") must not fall through
  // to the lenient English parser, which would quietly pick some other range.
  if (USFM_SHAPE.test(raw)) { return null; }

  try {
    const parsed = Bible.parseVerseRange(raw, 'en');
    if (parsed && Bible.validateRange(parsed.startVerseId, parsed.endVerseId)) {
      return describeRange(parsed.startVerseId, parsed.endVerseId);
    }
  }
  catch {
    // Unparseable text falls through to null.
  }
  return null;
};

export const PASSAGE_HELP = 'Write it as a USFM reference within one book (e.g. "JHN.3.16-18", "PSA.23", "GEN.1-3") or in English (e.g. "John 3:16-18", "Psalm 23"). A reading that spans books must be split into one passage per book.';

export class PassageError extends Error {}

export const requirePassage = (text: string): ResolvedPassage => {
  const passage = resolvePassage(text);
  if (!passage) {
    throw new PassageError(`"${text}" is not a passage My Bible Log recognizes. ${PASSAGE_HELP}`);
  }
  return passage;
};
